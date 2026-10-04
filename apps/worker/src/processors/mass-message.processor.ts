import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@lumora/db';

@Injectable()
export class MassMessageProcessor {
  private readonly logger = new Logger(MassMessageProcessor.name);
  private prisma = new PrismaClient();

  /**
   * Processes pending mass messages with batching in chunks of 1,000 (Story E10-3)
   */
  async processPendingMassMessages() {
    const now = new Date();
    const pendingMessages = await this.prisma.massMessage.findMany({
      where: {
        status: 'pending',
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: now } },
        ],
      },
      include: {
        creator: { include: { user: true } },
      },
      take: 10,
    });

    this.logger.log(`Found ${pendingMessages.length} mass messages ready for fan-out`);

    const results = {
      processed: 0,
      totalRecipients: 0,
      totalSent: 0,
    };

    for (const massMsg of pendingMessages) {
      try {
        await this.prisma.massMessage.update({
          where: { id: massMsg.id },
          data: { status: 'processing' },
        });

        // 1. Resolve eligible recipient fan IDs
        const filter = (massMsg.audienceFilter as any) || { segment: 'all_subscribers' };
        const recipientFanIds = await this.resolveRecipients(massMsg.creatorId, massMsg.creator.userId, filter);

        this.logger.log(`Mass message ${massMsg.id} has ${recipientFanIds.length} eligible recipients`);

        await this.prisma.massMessage.update({
          where: { id: massMsg.id },
          data: { recipientCount: recipientFanIds.length },
        });

        // 2. Fan-out in batches of 1,000 (Story E10-3)
        const batchSize = 1000;
        let sentCount = 0;

        for (let i = 0; i < recipientFanIds.length; i += batchSize) {
          const chunk = recipientFanIds.slice(i, i + batchSize);

          await this.prisma.$transaction(async (tx: any) => {
            for (const fanId of chunk) {
              // Get or create conversation
              const conv = await tx.conversation.upsert({
                where: {
                  creatorId_fanId: {
                    creatorId: massMsg.creatorId,
                    fanId,
                  },
                },
                create: {
                  creatorId: massMsg.creatorId,
                  fanId,
                  lastMessageAt: new Date(),
                  fanUnread: 1,
                },
                update: {
                  lastMessageAt: new Date(),
                  fanUnread: { increment: 1 },
                },
              });

              // Create message
              await tx.message.create({
                data: {
                  conversationId: conv.id,
                  senderId: massMsg.creator.userId,
                  body: massMsg.body,
                  priceCents: massMsg.priceCents,
                  isMass: true,
                  massMessageId: massMsg.id,
                },
              });

              sentCount++;
            }
          });
        }

        // 3. Complete mass message
        await this.prisma.massMessage.update({
          where: { id: massMsg.id },
          data: {
            status: 'completed',
            sentCount,
          },
        });

        results.processed++;
        results.totalRecipients += recipientFanIds.length;
        results.totalSent += sentCount;
      } catch (err: any) {
        this.logger.error(`Failed processing mass message ${massMsg.id}: ${err.message}`);
        await this.prisma.massMessage.update({
          where: { id: massMsg.id },
          data: { status: 'failed' },
        });
      }
    }

    return results;
  }

  private async resolveRecipients(
    creatorId: string,
    creatorUserId: string,
    filter: { segment: string; minSpendCents?: number },
  ): Promise<string[]> {
    // Exclude blocked users (Story E6-1 / E10-3)
    const blocks = await this.prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: creatorUserId }, { blockedId: creatorUserId }],
      },
    });
    const blockedUserIds = new Set(
      blocks.flatMap((b) => [b.blockerId, b.blockedId]),
    );

    let eligibleFanIds: string[] = [];

    if (filter.segment === 'all_subscribers') {
      const subs = await this.prisma.subscription.findMany({
        where: {
          creatorId,
          status: 'active',
        },
        select: { fanId: true },
      });
      eligibleFanIds = subs.map((s) => s.fanId);
    } else if (filter.segment === 'expired_subscribers') {
      const subs = await this.prisma.subscription.findMany({
        where: {
          creatorId,
          status: { in: ['expired', 'cancelled'] },
        },
        select: { fanId: true },
      });
      eligibleFanIds = subs.map((s) => s.fanId);
    } else if (filter.segment === 'top_spenders') {
      const minSpend = filter.minSpendCents || 5000;
      const purchases = await this.prisma.purchase.findMany({
        where: {
          sellerId: creatorUserId,
          status: 'succeeded',
        },
        select: { buyerId: true, grossCents: true },
      });

      const spendMap = new Map<string, number>();
      for (const p of purchases) {
        spendMap.set(p.buyerId, (spendMap.get(p.buyerId) || 0) + p.grossCents);
      }

      for (const [fanId, totalSpend] of spendMap.entries()) {
        if (totalSpend >= minSpend) {
          eligibleFanIds.push(fanId);
        }
      }
    } else {
      // Default: active subscribers
      const subs = await this.prisma.subscription.findMany({
        where: { creatorId, status: 'active' },
        select: { fanId: true },
      });
      eligibleFanIds = subs.map((s) => s.fanId);
    }

    // Deduplicate and filter out blocked users
    return Array.from(new Set(eligibleFanIds)).filter(
      (fanId) => !blockedUserIds.has(fanId),
    );
  }
}
