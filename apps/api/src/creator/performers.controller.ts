import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PerformersService } from './performers.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('creator/performers')
@UseGuards(JwtAuthGuard)
export class PerformersController {
  constructor(private performersService: PerformersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPerformer(
    @CurrentUser('id') userId: string,
    @Body() body: { legalName: string; stageName: string; dob: string; releaseDocRef?: string }
  ) {
    return this.performersService.createPerformer(userId, body);
  }

  @Post(':id/kyc-invite')
  @HttpCode(HttpStatus.CREATED)
  async createKycInvite(
    @CurrentUser('id') userId: string,
    @Param('id') performerId: string
  ) {
    return this.performersService.createKycInvite(userId, performerId);
  }

  @Get()
  async getPerformers(@CurrentUser('id') userId: string) {
    return this.performersService.getPerformers(userId);
  }
}
