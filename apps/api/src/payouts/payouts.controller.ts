import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PayoutsService } from './payouts.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import {
  CreatePayoutMethodRequest,
  RequestPayoutDto,
  PayoutMethodDto,
  PayoutDto,
  CreatorBalanceDto,
  CreatorStatementDto,
} from '@lumora/contracts';

@Controller('v1/creator')
@UseGuards(JwtAuthGuard)
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get('balance')
  async getBalance(@Request() req: any): Promise<CreatorBalanceDto> {
    return this.payoutsService.getCreatorBalance(req.user.id);
  }

  @Get('payout-methods')
  async getPayoutMethods(@Request() req: any): Promise<PayoutMethodDto[]> {
    return this.payoutsService.getPayoutMethods(req.user.id);
  }

  @Post('payout-methods')
  async createPayoutMethod(
    @Request() req: any,
    @Body() dto: CreatePayoutMethodRequest,
  ): Promise<PayoutMethodDto> {
    return this.payoutsService.createPayoutMethod(req.user.id, dto);
  }

  @Post('payouts')
  async requestPayout(
    @Request() req: any,
    @Body() dto: RequestPayoutDto,
  ): Promise<PayoutDto> {
    return this.payoutsService.requestPayout(req.user.id, dto);
  }

  @Get('payouts')
  async getPayouts(@Request() req: any): Promise<PayoutDto[]> {
    return this.payoutsService.getPayouts(req.user.id);
  }

  @Get('statements')
  async getStatements(
    @Request() req: any,
    @Query('year') year?: string,
  ): Promise<CreatorStatementDto[]> {
    return this.payoutsService.getStatements(
      req.user.id,
      year ? parseInt(year, 10) : 2026,
    );
  }
}
