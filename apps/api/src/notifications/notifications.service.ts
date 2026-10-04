import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationDto } from '@lumora/contracts';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List notifications for user
   */
  async getNotifications(userId: string, limit = 50): Promise<NotificationDto[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications.map((n) => {
      const payload = (n.payload as any) || {};
      return {
        id: n.id,
        userId: n.userId,
        type: n.type as any,
        title: payload.title || 'Notification',
        body: payload.body || '',
        data: payload.data || {},
        isRead: n.readAt !== null,
        createdAt: n.createdAt.toISOString(),
      };
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ success: boolean }> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return { success: true };
  }

  /**
   * Create an in-app notification
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<NotificationDto> {
    const n = await this.prisma.notification.create({
      data: {
        userId,
        type,
        payload: {
          title,
          body,
          data: data || {},
        },
      },
    });

    return {
      id: n.id,
      userId: n.userId,
      type: n.type as any,
      title,
      body,
      data: data || {},
      isRead: false,
      createdAt: n.createdAt.toISOString(),
    };
  }
}
