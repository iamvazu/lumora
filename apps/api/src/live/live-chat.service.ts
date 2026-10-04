import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  ProblemException,
  StreamChatSendRequest,
  StreamChatMessageDto,
} from '@lumora/contracts';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class LiveChatService {
  private readonly logger = new Logger(LiveChatService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Posts a chat message to a live stream with optional tip (Story E14-2)
   */
  async sendMessage(
    userId: string,
    streamId: string,
    dto: StreamChatSendRequest
  ): Promise<StreamChatMessageDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'User Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'User not found.',
        requestId: '',
      });
    }

    const stream = await this.prisma.liveStream.findUnique({
      where: { id: streamId },
      include: { creator: true },
    });

    if (!stream) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        title: 'Live Stream Not Found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Stream not found.',
        requestId: '',
      });
    }

    let tipPurchaseId: string | null = null;

    // Handle tip donation if tipAmountCents is present
    if (dto.tipAmountCents && dto.tipAmountCents > 0) {
      const tipAmount = dto.tipAmountCents;
      const feeCents = Math.floor(tipAmount * 0.2);
      const netCents = tipAmount - feeCents;

      // Atomic wallet deduction & purchase recording
      await this.prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!wallet || wallet.balanceCents < BigInt(tipAmount)) {
          throw new ProblemException({
            type: 'https://lumora.app/errors/payment-required',
            title: 'Insufficient Funds',
            status: 402,
            code: 'INSUFFICIENT_FUNDS',
            detail: `Wallet balance insufficient for $${(tipAmount / 100).toFixed(2)} tip.`,
            requestId: '',
          });
        }

        // Deduct wallet
        await tx.wallet.update({
          where: { userId },
          data: { balanceCents: { decrement: BigInt(tipAmount) } },
        });

        // Credit creator balance pending
        await tx.creatorBalance.upsert({
          where: { creatorId: stream.creator.id },
          create: {
            creatorId: stream.creator.id,
            pendingCents: BigInt(netCents),
            availableCents: 0n,
          },
          update: {
            pendingCents: { increment: BigInt(netCents) },
          },
        });

        // Record purchase
        const purchase = await tx.purchase.create({
          data: {
            buyerId: userId,
            sellerId: stream.creator.userId,
            type: 'stream_gift',
            resourceId: stream.id,
            grossCents: tipAmount,
            feeCents,
            netCents,
            currency: 'USD',
            status: 'succeeded',
            idempotencyKey: uuidv7(),
          },
        });

        tipPurchaseId = purchase.id;
      });

      this.logger.log(`Live tip of $${(dto.tipAmountCents / 100).toFixed(2)} sent by ${user.handle} in stream ${streamId}`);
    }

    // Save chat message
    const chat = await this.prisma.streamChat.create({
      data: {
        streamId,
        userId,
        body: dto.body,
        tipPurchaseId,
      },
      include: {
        user: true,
      },
    });

    return {
      id: chat.id,
      streamId: chat.streamId,
      userId: chat.userId,
      userHandle: chat.user.handle,
      userDisplayName: chat.user.displayName,
      userAvatarUrl: null,
      body: chat.body,
      tipAmountCents: dto.tipAmountCents || null,
      createdAt: chat.createdAt.toISOString(),
    };
  }

  /**
   * Retrieves chat message history for stream
   */
  async getChatHistory(streamId: string, limit = 50): Promise<StreamChatMessageDto[]> {
    const messages = await this.prisma.streamChat.findMany({
      where: { streamId },
      include: {
        user: true,
        tipPurchase: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse().map((m) => ({
      id: m.id,
      streamId: m.streamId,
      userId: m.userId,
      userHandle: m.user.handle,
      userDisplayName: m.user.displayName,
      userAvatarUrl: null,
      body: m.body,
      tipAmountCents: m.tipPurchase ? m.tipPurchase.grossCents : null,
      createdAt: m.createdAt.toISOString(),
    }));
  }
}
