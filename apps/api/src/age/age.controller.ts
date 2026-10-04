import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AgeService } from './age.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('age-verification')
@UseGuards(JwtAuthGuard)
export class AgeController {
  constructor(private ageService: AgeService) {}

  @Post('session')
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @CurrentUser('id') userId: string,
    @Body('country') country = 'US',
    @Body('state') state?: string
  ) {
    return this.ageService.createSession(userId, country, state);
  }

  @Get('status')
  async getStatus(@CurrentUser('id') userId: string) {
    return this.ageService.getStatus(userId);
  }
}
