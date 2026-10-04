import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ModerationService } from './moderation.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  ModerationReviewActionSchema,
  ModeratorWelfarePreferencesSchema,
  ProblemException,
} from '@lumora/contracts';
import type { Request } from 'express';

@Controller('admin/moderation')
@UseGuards(JwtAuthGuard)
export class AdminModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('queue')
  async getQueue(
    @Query('priority') priority?: number,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.moderationService.getQueue({ priority, status, page, limit });
  }

  @Post(':id/action')
  @HttpCode(HttpStatus.OK)
  async actionCase(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parse = ModerationReviewActionSchema.safeParse(body);
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
    const moderatorId = (req as any).user.userId || (req as any).user.id;
    return this.moderationService.actionCase(moderatorId, id, parse.data);
  }

  @Get('welfare')
  async getWelfarePreferences(@Req() req: Request) {
    const moderatorId = (req as any).user.userId || (req as any).user.id;
    return this.moderationService.getWelfarePreferences(moderatorId);
  }

  @Put('welfare')
  async updateWelfarePreferences(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parse = ModeratorWelfarePreferencesSchema.safeParse(body);
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
    const moderatorId = (req as any).user.userId || (req as any).user.id;
    return this.moderationService.updateWelfarePreferences(moderatorId, parse.data);
  }
}
