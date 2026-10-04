import {
  Controller,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import {
  CreatorAnalyticsSummaryDto,
  CreatorEarningsAnalyticsDto,
  TopFanDto,
} from '@lumora/contracts';

@Controller('creator/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  async getSummary(
    @CurrentUser('id') creatorUserId: string
  ): Promise<CreatorAnalyticsSummaryDto> {
    return this.analyticsService.getSummary(creatorUserId);
  }

  @Get('earnings')
  async getEarnings(
    @CurrentUser('id') creatorUserId: string,
    @Query('period') period?: string
  ): Promise<CreatorEarningsAnalyticsDto> {
    return this.analyticsService.getEarnings(creatorUserId, period || '30d');
  }

  @Get('fans')
  async getTopFans(
    @CurrentUser('id') creatorUserId: string,
    @Query('limit') limit?: number
  ): Promise<TopFanDto[]> {
    return this.analyticsService.getTopFans(creatorUserId, limit ? Number(limit) : 20);
  }
}
