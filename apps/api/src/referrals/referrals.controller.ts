import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ReferralsService } from './referrals.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CreatorReferralsSummaryDto } from '@lumora/contracts';
import type { Request } from 'express';

@Controller('creator/referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private referralsService: ReferralsService) {}

  @Get()
  async getSummary(@Req() req: Request): Promise<CreatorReferralsSummaryDto> {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.referralsService.getSummary(userId);
  }
}

