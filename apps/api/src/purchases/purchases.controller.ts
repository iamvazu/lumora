import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  PurchaseRequestSchema,
  TipRequestSchema,
  ProblemException,
} from '@lumora/contracts';
import type { Request } from 'express';

@Controller('purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async purchase(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parse = PurchaseRequestSchema.safeParse(body);
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
    const buyerId = (req as any).user.userId || (req as any).user.id;
    return this.purchasesService.purchase(buyerId, parse.data);
  }
}

@Controller('tips')
@UseGuards(JwtAuthGuard)
export class TipsController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async tip(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parse = TipRequestSchema.safeParse(body);
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
    const buyerId = (req as any).user.userId || (req as any).user.id;
    return this.purchasesService.tip(buyerId, parse.data);
  }
}
