import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WalletService } from './wallet.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  WalletTopupRequestSchema,
  UpdateWalletLimitsRequestSchema,
  ProblemException,
} from '@lumora/contracts';
import type { Request } from 'express';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@Req() req: Request) {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.walletService.getWallet(userId);
  }

  @Post('topups')
  @HttpCode(HttpStatus.OK)
  async topup(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parse = WalletTopupRequestSchema.safeParse(body);
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
    return this.walletService.topup(userId, parse.data);
  }

  @Put('limits')
  async updateLimits(
    @Body() body: any,
    @Req() req: Request,
  ) {
    const parse = UpdateWalletLimitsRequestSchema.safeParse(body);
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
    return this.walletService.updateLimits(userId, parse.data);
  }

  @Get('transactions')
  async getTransactions(
    @Query('limit') limit: number | undefined,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.walletService.getTransactions(userId, limit ? Number(limit) : 20);
  }
}
