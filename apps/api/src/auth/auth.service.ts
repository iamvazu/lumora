import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { v7 as uuidv7 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import {
  SignUpRequest,
  LoginRequest,
  AuthTokenResponse,
  Setup2FAResponse,
  ProblemException,
} from '@lumora/contracts';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService
  ) {}

  /**
   * Registers a new user account (Fan or Creator candidate)
   */
  async signup(dto: SignUpRequest, ip?: string, userAgent?: string): Promise<{ response: AuthTokenResponse; refreshToken: string }> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email.toLowerCase() }, { handle: dto.handle.toLowerCase() }],
      },
    });

    if (existingUser) {
      const isEmail = existingUser.email.toLowerCase() === dto.email.toLowerCase();
      throw new ProblemException({
        type: 'https://lumora.app/errors/conflict',
        title: 'Conflict',
        status: 409,
        code: 'CONFLICT',
        detail: isEmail
          ? 'An account with this email already exists.'
          : 'This handle is already taken. Please choose another.',
        requestId: '',
      });
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        handle: dto.handle.toLowerCase(),
        displayName: dto.displayName,
        role: dto.role,
        country: dto.country,
        wallet: {
          create: {
            currency: 'USD',
            balanceCents: 0n,
          },
        },
      },
    });

    // Create session & tokens
    const { accessToken, refreshToken, expiresInSeconds } = await this.createSession(
      user.id,
      user.email,
      user.handle,
      user.role,
      ip,
      userAgent
    );

    return {
      response: {
        accessToken,
        expiresInSeconds,
        user: {
          id: user.id,
          email: user.email,
          handle: user.handle,
          displayName: user.displayName,
          role: user.role,
          status: user.status,
          avatarMediaId: user.avatarMediaId,
          isEmailVerified: !!user.emailVerifiedAt,
          isAgeVerified: !!user.ageVerifiedAt,
          is2FAEnabled: !!user.totpSecretEnc,
        },
      },
      refreshToken,
    };
  }

  /**
   * Authenticates a user with email/handle + password + optional TOTP
   */
  async login(dto: LoginRequest, ip?: string, userAgent?: string): Promise<{ response: AuthTokenResponse; refreshToken: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.emailOrHandle.toLowerCase() },
          { handle: dto.emailOrHandle.toLowerCase() },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/invalid-credentials',
        title: 'Invalid Credentials',
        status: 401,
        code: 'INVALID_CREDENTIALS',
        detail: 'The email/handle or password you entered is incorrect.',
        requestId: '',
      });
    }

    if (user.status === 'banned' || user.status === 'deleted') {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        title: 'Account Inaccessible',
        status: 403,
        code: 'FORBIDDEN',
        detail: 'This account has been suspended or deleted.',
        requestId: '',
      });
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/invalid-credentials',
        title: 'Invalid Credentials',
        status: 401,
        code: 'INVALID_CREDENTIALS',
        detail: 'The email/handle or password you entered is incorrect.',
        requestId: '',
      });
    }

    // 2FA check (mandatory for creators and agencies, or if user enabled TOTP)
    const has2FA = !!user.totpSecretEnc;

    if (has2FA && user.totpSecretEnc) {
      if (!dto.totpCode) {
        return {
          response: {
            accessToken: '',
            expiresInSeconds: 0,
            user: {
              id: user.id,
              email: user.email,
              handle: user.handle,
              displayName: user.displayName,
              role: user.role,
              status: user.status,
              avatarMediaId: user.avatarMediaId,
              isEmailVerified: !!user.emailVerifiedAt,
              isAgeVerified: !!user.ageVerifiedAt,
              is2FAEnabled: true,
            },
            requires2FA: true,
          },
          refreshToken: '',
        };
      }

      const totpSecret = Buffer.from(user.totpSecretEnc).toString('utf-8');
      const isValidTotp = authenticator.verify({
        token: dto.totpCode,
        secret: totpSecret,
      });

      if (!isValidTotp) {
        throw new ProblemException({
          type: 'https://lumora.app/errors/invalid-totp',
          title: 'Invalid 2FA Code',
          status: 401,
          code: 'INVALID_CREDENTIALS',
          detail: 'The two-factor authentication code is invalid or has expired.',
          requestId: '',
        });
      }
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { accessToken, refreshToken, expiresInSeconds } = await this.createSession(
      user.id,
      user.email,
      user.handle,
      user.role,
      ip,
      userAgent
    );

    return {
      response: {
        accessToken,
        expiresInSeconds,
        user: {
          id: user.id,
          email: user.email,
          handle: user.handle,
          displayName: user.displayName,
          role: user.role,
          status: user.status,
          avatarMediaId: user.avatarMediaId,
          isEmailVerified: !!user.emailVerifiedAt,
          isAgeVerified: !!user.ageVerifiedAt,
          is2FAEnabled: has2FA,
        },
      },
      refreshToken,
    };
  }

  /**
   * Refreshes access token and rotates the refresh token
   */
  async refresh(refreshToken: string, ip?: string, userAgent?: string): Promise<{ response: AuthTokenResponse; newRefreshToken: string }> {
    if (!refreshToken) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/unauthorized',
        title: 'Missing Refresh Token',
        status: 401,
        code: 'UNAUTHORIZED',
        detail: 'No refresh token provided.',
        requestId: '',
      });
    }

    const hashedToken = await this.hashToken(refreshToken);

    const session = await this.prisma.session.findFirst({
      where: {
        refreshTokenHash: hashedToken,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session || !session.user) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/unauthorized',
        title: 'Invalid Session',
        status: 401,
        code: 'UNAUTHORIZED',
        detail: 'Session is expired or has been revoked.',
        requestId: '',
      });
    }

    // Rotate refresh token
    const newRefreshToken = uuidv7();
    const newHashedToken = await this.hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: newHashedToken,
        expiresAt: newExpiresAt,
        ip: ip || session.ip,
        userAgent: userAgent || session.userAgent,
      },
    });

    const accessToken = this.jwtService.sign(
      {
        sub: session.user.id,
        email: session.user.email,
        handle: session.user.handle,
        role: session.user.role,
        sessionId: session.id,
      },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'lumora_dev_jwt_access_secret_super_secure_minimum_32_bytes_long',
        expiresIn: '15m',
      }
    );

    return {
      response: {
        accessToken,
        expiresInSeconds: 900,
        user: {
          id: session.user.id,
          email: session.user.email,
          handle: session.user.handle,
          displayName: session.user.displayName,
          role: session.user.role,
          status: session.user.status,
          avatarMediaId: session.user.avatarMediaId,
          isEmailVerified: !!session.user.emailVerifiedAt,
          isAgeVerified: !!session.user.ageVerifiedAt,
          is2FAEnabled: !!session.user.totpSecretEnc,
        },
      },
      newRefreshToken,
    };
  }

  /**
   * Revokes current session
   */
  async logout(sessionId: string): Promise<void> {
    if (sessionId) {
      await this.prisma.session.updateMany({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });
    }
  }

  /**
   * Initiates TOTP 2FA setup
   */
  async setup2FA(userId: string): Promise<Setup2FAResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'User Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'User not found.',
        requestId: '',
      });
    }

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, 'Lumora', secret);
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

    // Generate 6 backup codes
    const backupCodes = Array.from({ length: 6 }, () => uuidv7().substring(0, 8).toUpperCase());

    // Temporarily cache setup secret in Redis for 10 minutes
    await this.redisService.set(`2fa_setup:${userId}`, secret, 600);

    return {
      secret,
      otpAuthUrl,
      qrCodeDataUrl,
      backupCodes,
    };
  }

  /**
   * Verifies TOTP token and commits 2FA to user account
   */
  async verify2FA(userId: string, code: string): Promise<{ success: boolean }> {
    const pendingSecret = await this.redisService.get(`2fa_setup:${userId}`);
    if (!pendingSecret) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'Setup Expired',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: '2FA setup expired or was not initiated. Please request a new setup QR code.',
        requestId: '',
      });
    }

    const isValid = authenticator.verify({
      token: code,
      secret: pendingSecret,
    });

    if (!isValid) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'Invalid Code',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: 'The verification code is incorrect. Please check your authenticator app and try again.',
        requestId: '',
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpSecretEnc: Buffer.from(pendingSecret, 'utf-8'),
      },
    });

    await this.redisService.del(`2fa_setup:${userId}`);

    return { success: true };
  }

  /**
   * Disables 2FA (requires valid TOTP code verification)
   */
  async disable2FA(userId: string, code: string): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecretEnc) {
      return { success: true };
    }

    if (user.role === 'creator' || user.role === 'agency') {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        title: '2FA Mandatory',
        status: 403,
        code: 'FORBIDDEN',
        detail: 'Two-factor authentication is mandatory for creator and agency accounts and cannot be disabled.',
        requestId: '',
      });
    }

    const secret = Buffer.from(user.totpSecretEnc).toString('utf-8');
    const isValid = authenticator.verify({ token: code, secret });
    if (!isValid) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'Invalid Code',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: 'The verification code is incorrect.',
        requestId: '',
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecretEnc: null },
    });

    return { success: true };
  }

  private async createSession(
    userId: string,
    email: string,
    handle: string,
    role: string,
    ip?: string,
    userAgent?: string
  ) {
    const sessionId = uuidv7();
    const refreshToken = uuidv7();
    const hashedRefreshToken = await this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId,
        refreshTokenHash: hashedRefreshToken,
        ip,
        userAgent,
        expiresAt,
      },
    });

    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        handle,
        role,
        sessionId,
      },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET') || 'lumora_dev_jwt_access_secret_super_secure_minimum_32_bytes_long',
        expiresIn: '15m',
      }
    );

    return {
      sessionId,
      accessToken,
      refreshToken,
      expiresInSeconds: 900,
    };
  }

  private async hashToken(token: string): Promise<string> {
    return argon2.hash(token, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
    });
  }
}
