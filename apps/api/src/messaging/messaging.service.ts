import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  SendMessageRequest,
  MassMessageRequest,
  MessageDto,
  ConversationDto,
  MassMessageDto,
  ProblemException,
} from '@lumora/contracts';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get conversations for user (fan or creator)
   */
  async getConversations(userId: string): Promise<ConversationDto[]> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId },
    });

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { fanId: userId },
          ...(creator ? [{ creatorId: creator.id }] : []),
        ],
      },
      include: {
        creator: { include: { user: true } },
        fan: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: true,
            media: { include: { media: true } },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return conversations.map((c) => {
      const isCreator = creator && c.creatorId === creator.id;
      const unreadCount = isCreator ? c.creatorUnread : c.fanUnread;
      const lastMsg = c.messages[0];

      return {
        id: c.id,
        creatorId: c.creatorId,
        creatorUserId: c.creator.userId,
        creatorHandle: c.creator.user.handle,
        creatorDisplayName: c.creator.user.displayName,
        creatorAvatarUrl: null,
        fanId: c.fanId,
        fanHandle: c.fan.handle,
        fanDisplayName: c.fan.displayName,
        fanAvatarUrl: null,
        unreadCount,
        lastMessageAt: c.lastMessageAt.toISOString(),
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              conversationId: lastMsg.conversationId,
              senderId: lastMsg.senderId,
              senderHandle: lastMsg.sender.handle,
              senderDisplayName: lastMsg.sender.displayName,
              sentByStaffId: lastMsg.sentByStaffId,
              body: lastMsg.body,
              priceCents: lastMsg.priceCents,
              isLocked: false,
              isUnlocked: true,
              isMass: lastMsg.isMass,
              media: [],
              readAt: lastMsg.readAt?.toISOString() || null,
              createdAt: lastMsg.createdAt.toISOString(),
            }
          : null,
      };
    });
  }

  /**
   * Get messages in a conversation with PPV unlocking logic (Story E10-1)
   */
  async getMessages(
    userId: string,
    conversationId: string,
    limit = 50,
  ): Promise<MessageDto[]> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { creator: true },
    });

    if (!conversation) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Conversation Not Found',
        detail: 'The requested conversation thread does not exist.',
        requestId: '',
      });
    }

    const isAuthorized =
      conversation.fanId === userId || conversation.creator.userId === userId;

    if (!isAuthorized) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        status: 403,
        code: 'FORBIDDEN',
        title: 'Forbidden',
        detail: 'You are not a participant in this conversation.',
        requestId: '',
      });
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: true,
        media: { include: { media: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    // Check PPV message entitlements for this user
    const messageIds = messages.map((m) => m.id);
    const entitlements = await this.prisma.entitlement.findMany({
      where: {
        userId,
        resourceType: 'message',
        resourceId: { in: messageIds },
      },
    });
    const unlockedMessageIds = new Set(entitlements.map((e) => e.resourceId));

    return messages.map((m) => {
      const isSender = m.senderId === userId;
      const isPpv = Boolean(m.priceCents && m.priceCents > 0);
      const isUnlocked = isSender || !isPpv || unlockedMessageIds.has(m.id);

      return {
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderHandle: m.sender.handle,
        senderDisplayName: m.sender.displayName,
        sentByStaffId: m.sentByStaffId,
        body: !isUnlocked ? '🔒 Locked PPV Message' : m.body,
        priceCents: m.priceCents,
        isLocked: !isUnlocked,
        isUnlocked,
        isMass: m.isMass,
        readAt: m.readAt?.toISOString() || null,
        createdAt: m.createdAt.toISOString(),
        media: m.media.map((item) => ({
          id: item.id,
          mediaId: item.mediaId,
          position: item.position,
          url: isUnlocked ? item.media.storageKey : undefined,
          thumbnailUrl: isUnlocked
            ? item.media.thumbKey || undefined
            : item.media.blurredKey || undefined,
          isLocked: !isUnlocked,
          mimeType: item.media.mime,
        })),
      };
    });
  }

  /**
   * Send a 1:1 message
   */
  async sendMessage(
    senderUserId: string,
    conversationId: string,
    dto: SendMessageRequest,
  ): Promise<MessageDto> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { creator: true, fan: true },
    });

    if (!conversation) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Conversation Not Found',
        detail: 'Conversation thread not found.',
        requestId: '',
      });
    }

    const isCreator = conversation.creator.userId === senderUserId;
    const isFan = conversation.fanId === senderUserId;

    if (!isCreator && !isFan) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        status: 403,
        code: 'FORBIDDEN',
        title: 'Forbidden',
        detail: 'You are not a participant in this conversation.',
        requestId: '',
      });
    }

    // Verify agency staff attribution if provided (Story E10-1)
    if (dto.sentByStaffId) {
      const agencyLink = await this.prisma.agencyCreator.findFirst({
        where: {
          creatorId: conversation.creatorId,
          agency: {
            members: { some: { userId: dto.sentByStaffId } },
          },
        },
      });

      if (!agencyLink) {
        throw new ProblemException({
          type: 'https://lumora.app/errors/forbidden',
          status: 403,
          code: 'FORBIDDEN',
          title: 'Staff Attribution Invalid',
          detail: 'Staff user is not authorized on this creator account.',
          requestId: '',
        });
      }
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: senderUserId,
          sentByStaffId: dto.sentByStaffId || null,
          body: dto.body,
          priceCents: dto.priceCents || null,
          media: {
            create: (dto.mediaIds || []).map((mediaId, index) => ({
              mediaId,
              position: index,
            })),
          },
        },
        include: {
          sender: true,
          media: { include: { media: true } },
        },
      });

      // Increment recipient unread counter and update lastMessageAt
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          creatorUnread: isFan ? { increment: 1 } : undefined,
          fanUnread: isCreator ? { increment: 1 } : undefined,
        },
      });

      return msg;
    });

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderHandle: message.sender.handle,
      senderDisplayName: message.sender.displayName,
      sentByStaffId: message.sentByStaffId,
      body: message.body,
      priceCents: message.priceCents,
      isLocked: false,
      isUnlocked: true,
      isMass: message.isMass,
      readAt: null,
      createdAt: message.createdAt.toISOString(),
      media: message.media.map((item) => ({
        id: item.id,
        mediaId: item.mediaId,
        position: item.position,
        url: item.media.storageKey,
        thumbnailUrl: item.media.thumbKey || undefined,
        isLocked: false,
        mimeType: item.media.mime,
      })),
    };
  }

  /**
   * Mark conversation as read (Story E10-1)
   */
  async markAsRead(userId: string, conversationId: string): Promise<{ success: boolean }> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { creator: true },
    });

    if (!conversation) return { success: false };

    const isCreator = conversation.creator.userId === userId;

    await this.prisma.$transaction([
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          creatorUnread: isCreator ? 0 : undefined,
          fanUnread: !isCreator ? 0 : undefined,
        },
      }),
      this.prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      }),
    ]);

    return { success: true };
  }

  /**
   * Create a Mass Message with Rate Limiting (Story E10-3)
   */
  async createMassMessage(
    creatorUserId: string,
    dto: MassMessageRequest,
  ): Promise<MassMessageDto> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
    });

    if (!creator) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        status: 403,
        code: 'FORBIDDEN',
        title: 'Not a Creator',
        detail: 'Mass messages are only accessible to creators.',
        requestId: '',
      });
    }

    // Rate Limit Check: max 5 mass messages/hour per creator (Story E10-3)
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    const recentMassCount = await this.prisma.massMessage.count({
      where: {
        creatorId: creator.id,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentMassCount >= 5) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/rate-limited',
        status: 429,
        code: 'RATE_LIMITED',
        title: 'Mass Message Limit Exceeded',
        detail: 'You have reached the maximum rate limit of 5 mass messages per hour.',
        requestId: '',
      });
    }

    const massMessage = await this.prisma.massMessage.create({
      data: {
        creatorId: creator.id,
        body: dto.body,
        priceCents: dto.priceCents || null,
        audienceFilter: dto.audienceFilter as any,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        status: 'pending',
        recipientCount: 0,
        sentCount: 0,
      },
    });

    this.logger.log(`Created Mass Message ${massMessage.id} for creator ${creator.id}`);

    return {
      id: massMessage.id,
      creatorId: massMessage.creatorId,
      body: massMessage.body,
      priceCents: massMessage.priceCents,
      audienceFilter: massMessage.audienceFilter as any,
      scheduledAt: massMessage.scheduledAt?.toISOString() || null,
      status: massMessage.status as any,
      recipientCount: massMessage.recipientCount,
      sentCount: massMessage.sentCount,
      createdAt: massMessage.createdAt.toISOString(),
    };
  }
}
