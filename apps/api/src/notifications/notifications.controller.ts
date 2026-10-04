import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { NotificationDto } from '@lumora/contracts';

@Controller('v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('limit') limit?: string,
  ): Promise<NotificationDto[]> {
    return this.notificationsService.getNotifications(
      req.user.id,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post('read-all')
  async markAllAsRead(@Request() req: any): Promise<{ success: boolean }> {
    return this.notificationsService.markAllAsRead(req.user.id);
  }
}
