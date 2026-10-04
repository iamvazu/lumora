import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  CreateSubscriptionPlanRequestSchema,
  CreatePromotionRequestSchema,
  ProblemException,
} from '@lumora/contracts';
import type { Request } from 'express';

@Controller('creator/plans')
@UseGuards(JwtAuthGuard)
export class CreatorPlansController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async getPlans(@Req() req: Request) {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.subscriptionsService.getCreatorPlans(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPlan(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parse = CreateSubscriptionPlanRequestSchema.safeParse(body);
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
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.subscriptionsService.createPlan(userId, parse.data);
  }
}

@Controller('creator/promotions')
@UseGuards(JwtAuthGuard)
export class CreatorPromotionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async getPromotions(@Req() req: Request) {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.subscriptionsService.getCreatorPromotions(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPromotion(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parse = CreatePromotionRequestSchema.safeParse(body);
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
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.subscriptionsService.createPromotion(userId, parse.data);
  }
}
