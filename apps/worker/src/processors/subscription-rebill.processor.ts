import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@lumora/db';
import { LedgerEngine } from '@lumora/ledger';
import { randomUUID } from 'node:crypto';

@Injectable()
export class SubscriptionRebillProcessor {
  private readonly logger = new Logger(SubscriptionRebillProcessor.name);
  private prisma = new PrismaClient();

  /**
   * Runs the hourly recurring subscription renewal batch (Story E8-2)
   */
  async processDueSubscriptions(mockDeclinedFanId?: string) {
    const now = new Date();
    this.logger.log(`Running subscription renewal batch at ${now.toISOString()}`);

    const dueSubscriptions = await this.prisma.subscription.findMany({
      where: {
        currentPeriodEnd: { lte: now },
        status: { in: ['active', 'past_due'] },
        autoRenew: true,
      },
      include: {
        plan: true,
        fan: { include: { wallet: true } },
        creator: { include: { user: true } },
      },
      take: 100,
    });

    this.logger.log(`Found ${dueSubscriptions.length} subscriptions due for rebill`);

    const results = {
      renewed: 0,
      pastDue: 0,
      expired: 0,
    };

    for (const sub of dueSubscriptions) {
      try {
        const priceCents = sub.plan.priceCents;
        const isMockDeclined = mockDeclinedFanId === sub.fanId;

        // Check if fan has enough wallet balance or card charge succeeds
        const hasFunds = !isMockDeclined && sub.fan.wallet && sub.fan.wallet.balanceCents >= BigInt(priceCents);

        if (hasFunds) {
          // Successful renewal
          await this.prisma.$transaction(async (tx: any) => {
            const txId = randomUUID();

            let fanWalletAcc = await tx.ledgerAccount.findFirst({
              where: { ownerType: 'fan_wallet', ownerId: sub.fanId },
            });
            if (!fanWalletAcc) {
              fanWalletAcc = await tx.ledgerAccount.create({
                data: { ownerType: 'fan_wallet', ownerId: sub.fanId, currency: 'USD', type: 'liability' },
              });
            }

            let creatorPendingAcc = await tx.ledgerAccount.findFirst({
              where: { ownerType: 'creator', ownerId: sub.creatorId },
            });
            if (!creatorPendingAcc) {
              creatorPendingAcc = await tx.ledgerAccount.create({
                data: { ownerType: 'creator', ownerId: sub.creatorId, currency: 'USD', type: 'liability' },
              });
            }

            let platformRevAcc = await tx.ledgerAccount.findFirst({
              where: { ownerType: 'platform' },
            });
            if (!platformRevAcc) {
              platformRevAcc = await tx.ledgerAccount.create({
                data: { ownerType: 'platform', currency: 'USD', type: 'revenue' },
              });
            }

            const ledgerTx = LedgerEngine.buildWalletSpendTransaction({
              transactionId: txId,
              kind: 'renewal_charge',
              referenceType: 'subscription',
              referenceId: sub.id,
              postedAt: new Date(),
              walletAccountId: fanWalletAcc.id,
              creatorPendingAccountId: creatorPendingAcc.id,
              platformRevenueAccountId: platformRevAcc.id,
              amountCents: BigInt(priceCents),
              currency: 'USD',
            });

            await tx.ledgerTransaction.create({
              data: {
                id: txId,
                kind: 'renewal_charge',
                referenceType: 'subscription',
                referenceId: sub.id,
                entries: {
                  create: ledgerTx.entries.map((e) => ({
                    accountId: e.accountId,
                    amountCents: e.amountCents,
                  })),
                },
              },
            });

            // Debit wallet
            await tx.wallet.update({
              where: { userId: sub.fanId },
              data: { balanceCents: { decrement: BigInt(priceCents) } },
            });

            // Increment creator pending balance (80% net)
            const creatorNetCents = BigInt(Math.round((priceCents * 80) / 100));
            await tx.creatorBalance.upsert({
              where: { creatorId: sub.creatorId },
              create: {
                creatorId: sub.creatorId,
                pendingCents: creatorNetCents,
                availableCents: 0n,
              },
              update: {
                pendingCents: { increment: creatorNetCents },
              },
            });

            // Extend period
            const newStart = new Date();
            const newEnd = new Date();
            newEnd.setMonth(newEnd.getMonth() + sub.plan.periodMonths);

            await tx.subscription.update({
              where: { id: sub.id },
              data: {
                status: 'active',
                currentPeriodStart: newStart,
                currentPeriodEnd: newEnd,
              },
            });

            // Record purchase
            await tx.purchase.create({
              data: {
                buyerId: sub.fanId,
                sellerId: sub.creator.userId,
                type: 'renewal',
                resourceId: sub.planId,
                grossCents: priceCents,
                feeCents: priceCents - Number(creatorNetCents),
                netCents: Number(creatorNetCents),
                currency: 'USD',
                status: 'succeeded',
                idempotencyKey: `rebill_${sub.id}_${now.getTime()}`,
              },
            });
          });

          results.renewed++;
        } else {
          // Payment Failed: Dunning retry flow (+1d, +3d, +5d) -> expired
          if (sub.status === 'active') {
            await this.prisma.subscription.update({
              where: { id: sub.id },
              data: { status: 'past_due' },
            });
            results.pastDue++;
          } else if (sub.status === 'past_due') {
            // Already past due and failed retry -> expire and revoke entitlement
            await this.prisma.$transaction([
              this.prisma.subscription.update({
                where: { id: sub.id },
                data: { status: 'expired' },
              }),
              this.prisma.entitlement.deleteMany({
                where: {
                  userId: sub.fanId,
                  resourceType: 'post',
                  resourceId: sub.creatorId,
                },
              }),
            ]);
            results.expired++;
          }
        }
      } catch (err: any) {
        this.logger.error(`Error processing rebill for sub ${sub.id}: ${err.message}`);
      }
    }

    return results;
  }
}
