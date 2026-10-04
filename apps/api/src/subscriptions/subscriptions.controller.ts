import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  SubscriptionRequestSchema,
  ProblemException,
} from '@lumora/contracts';
import type { Request } from 'express';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async subscribe(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parse = SubscriptionRequestSchema.safeParse(body);
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
    const fanId = (req as any).user.userId || (req as any).user.id;
    return this.subscriptionsService.subscribe(fanId, parse.data);
  }

  @Patch(':id')
  async toggleAutoRenew(
    @Param('id') subscriptionId: string,
    @Req() req: Request,
  ) {
    const fanId = (req as any).user.userId || (req as any).user.id;
    return this.subscriptionsService.toggleAutoRenew(fanId, subscriptionId);
  }

  @Get()
  async getMySubscriptions(@Req() req: Request) {
    const fanId = (req as any).user.userId || (req as any).user.id;
    return this.subscriptionsService.getFanSubscriptions(fanId);
  }
}
