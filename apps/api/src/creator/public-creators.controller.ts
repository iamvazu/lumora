import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreatorService } from './creator.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import type { Request } from 'express';

@Controller('creators')
export class PublicCreatorsController {
  constructor(private readonly creatorService: CreatorService) {}

  @Get(':handle')
  async getProfile(@Param('handle') handle: string, @Req() req: Request) {
    const viewerUserId = (req as any).user?.userId || (req as any).user?.id || undefined;
    return this.creatorService.getPublicProfile(handle, viewerUserId);
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async follow(@Param('id') creatorId: string, @Req() req: Request) {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.creatorService.follow(userId, creatorId);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unfollow(@Param('id') creatorId: string, @Req() req: Request) {
    const userId = (req as any).user.userId || (req as any).user.id;
    return this.creatorService.unfollow(userId, creatorId);
  }
}
