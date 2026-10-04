import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AccountService } from './account.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator.js';
import { UpdateProfileRequestSchema, ProblemException } from '@lumora/contracts';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private accountService: AccountService) {}

  @Get()
  async getProfile(@CurrentUser('id') userId: string) {
    return this.accountService.getProfile(userId);
  }

  @Patch()
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: any
  ) {
    const parse = UpdateProfileRequestSchema.safeParse(body);
    if (!parse.success) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: parse.error.errors.map((e) => e.message).join('; '),
        requestId: '',
      });
    }
    return this.accountService.updateProfile(userId, parse.data);
  }

  @Get('sessions')
  async getSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.accountService.getSessions(user.id, user.sessionId);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string
  ) {
    return this.accountService.revokeSession(userId, sessionId);
  }

  @Post('export')
  @HttpCode(HttpStatus.ACCEPTED)
  async exportData(@CurrentUser('id') userId: string) {
    return this.accountService.exportData(userId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@CurrentUser('id') userId: string) {
    return this.accountService.deleteAccount(userId);
  }
}
