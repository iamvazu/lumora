import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ModerationService } from './moderation.service.js';
import { CreateReportRequestSchema, ProblemException } from '@lumora/contracts';
import type { Request } from 'express';

@Controller('reports')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReport(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parse = CreateReportRequestSchema.safeParse(body);
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
    const reporterId = (req as any).user?.userId || (req as any).user?.id || null;
    return this.moderationService.createReport(reporterId, parse.data);
  }
}
