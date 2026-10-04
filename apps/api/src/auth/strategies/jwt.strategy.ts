import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ProblemException } from '@lumora/contracts';

export interface JwtPayload {
  sub: string;
  email: string;
  handle: string;
  role: string;
  sessionId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || 'lumora_dev_jwt_access_secret_super_secure_minimum_32_bytes_long',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        handle: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status === 'deleted' || user.status === 'banned') {
      throw new ProblemException({
        type: 'https://lumora.app/errors/unauthorized',
        title: 'Unauthorized',
        status: 401,
        code: 'UNAUTHORIZED',
        detail: 'User account is invalid, suspended, or deleted.',
        requestId: '',
      });
    }

    return {
      id: user.id,
      email: user.email,
      handle: user.handle,
      role: user.role,
      sessionId: payload.sessionId,
    };
  }
}
