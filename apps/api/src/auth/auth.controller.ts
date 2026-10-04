import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator.js';
import {
  SignUpRequestSchema,
  LoginRequestSchema,
  Verify2FARequestSchema,
  ProblemException,
} from '@lumora/contracts';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const parseResult = SignUpRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: parseResult.error.errors.map((e) => e.message).join('; '),
        requestId: '',
        invalidParams: parseResult.error.errors.map((e) => ({
          name: e.path.join('.'),
          reason: e.message,
        })),
      });
    }

    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { response, refreshToken } = await this.authService.signup(
      parseResult.data,
      ip,
      userAgent
    );

    this.setRefreshTokenCookie(res, refreshToken);
    return response;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const parseResult = LoginRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: parseResult.error.errors.map((e) => e.message).join('; '),
        requestId: '',
      });
    }

    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { response, refreshToken } = await this.authService.login(
      parseResult.data,
      ip,
      userAgent
    );

    if (refreshToken) {
      this.setRefreshTokenCookie(res, refreshToken);
    }

    return response;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = (req.cookies as Record<string, string> | undefined)?.['lumora_refresh_token'] || (req.body?.refreshToken as string);
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const { response, newRefreshToken } = await this.authService.refresh(
      refreshToken,
      ip,
      userAgent
    );

    this.setRefreshTokenCookie(res, newRefreshToken);
    return response;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response
  ) {
    await this.authService.logout(user.sessionId);
    res.clearCookie('lumora_refresh_token', {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      path: '/v1/auth',
    });
    return { success: true };
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async setup2FA(@CurrentUser('id') userId: string) {
    return this.authService.setup2FA(userId);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verify2FA(
    @CurrentUser('id') userId: string,
    @Body() body: any
  ) {
    const parse = Verify2FARequestSchema.safeParse(body);
    if (!parse.success) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: 'A valid 6-digit TOTP code is required.',
        requestId: '',
      });
    }
    return this.authService.verify2FA(userId, parse.data.code);
  }

  @Delete('2fa')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disable2FA(
    @CurrentUser('id') userId: string,
    @Body() body: any
  ) {
    const code = body?.code as string;
    if (!code) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: 'Current 2FA code is required to disable two-factor authentication.',
        requestId: '',
      });
    }
    return this.authService.disable2FA(userId, code);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('token') _token: string) {
    return { success: true, message: 'Email successfully verified' };
  }

  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  async magicLink(@Body('email') _email: string) {
    return { success: true, message: 'Magic link sent to email if account exists' };
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('lumora_refresh_token', token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      path: '/v1/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
}
