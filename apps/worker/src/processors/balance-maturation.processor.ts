import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@lumora/db';
import { LedgerEngine } from '@lumora/ledger';
import { randomUUID } from 'node:crypto';

@Injectable()
export class BalanceMaturationProcessor {
  private readonly logger = new Logger(BalanceMaturationProcessor.name);
  private prisma = new PrismaClient();

  /**
   * Processes creator pending balances that have passed their holding period (Story E12-1)
   */
  async processMaturingBalances() {
    const now = new Date();
    this.logger.log(`Running creator balance maturation batch at ${now.toISOString()}`);

    // Query creators with pending funds
    const creatorsWithPending = await this.prisma.creatorProfile.findMany({
      where: {
        creatorBalance: {
          pendingCents: { gt: 0n },
        },
      },
      include: {
        creatorBalance: true,
        user: true,
      },
      take: 50,
    });

    this.logger.log(`Found ${creatorsWithPending.length} creators with pending funds to evaluate`);

    const results = {
      evaluated: 0,
      maturedCreators: 0,
      totalMaturedCents: 0,
    };

    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 3600 * 1000);

    for (const creator of creatorsWithPending) {
      try {
        results.evaluated++;

        // Determine holding period: 7 days for new creators, 3 days for mature creators (Story E12-1)
        const isMature = creator.createdAt <= ninetyDaysAgo;
        const holdingDays = isMature ? 3 : 7;
        const holdingThreshold = new Date(now.getTime() - holdingDays * 24 * 3600 * 1000);

        // Find purchases that have matured and have not yet been released
        const eligiblePurchases = await this.prisma.purchase.findMany({
          where: {
            sellerId: creator.userId,
            status: 'succeeded',
            createdAt: { lte: holdingThreshold },
          },
        });

        const totalNetMaturedCents = eligiblePurchases.reduce(
          (acc, p) => acc + p.netCents,
          0,
        );

        if (totalNetMaturedCents <= 0) continue;

        const availablePending = Number(creator.creatorBalance?.pendingCents || 0n);
        const amountToMatureCents = Math.min(totalNetMaturedCents, availablePending);

        if (amountToMatureCents <= 0) continue;

        // Atomically update double-entry ledger and shift CreatorBalance
        await this.prisma.$transaction(async (tx: any) => {
          const txId = randomUUID();

          let creatorPendingAcc = await tx.ledgerAccount.findFirst({
            where: { ownerType: 'creator', ownerId: creator.id, currency: 'USD' },
          });
          if (!creatorPendingAcc) {
            creatorPendingAcc = await tx.ledgerAccount.create({
              data: { ownerType: 'creator', ownerId: creator.id, currency: 'USD' },
            });
          }

          let creatorAvailableAcc = await tx.ledgerAccount.findFirst({
            where: { ownerType: 'creator', ownerId: creator.id, currency: 'USD' },
          });
          if (!creatorAvailableAcc) {
            creatorAvailableAcc = await tx.ledgerAccount.create({
              data: { ownerType: 'creator', ownerId: creator.id, currency: 'USD' },
            });
          }

          const ledgerTx = LedgerEngine.buildMaturationTransaction({
            transactionId: txId,
            postedAt: now,
            creatorPendingAccountId: creatorPendingAcc.id,
            creatorAvailableAccountId: creatorAvailableAcc.id,
            amountCents: BigInt(amountToMatureCents),
          });

          await tx.ledgerTransaction.create({
            data: {
              id: txId,
              kind: 'balance_maturation',
              referenceType: 'maturation',
              referenceId: txId,
              entries: {
                create: ledgerTx.entries.map((e: any) => ({
                  accountId: e.accountId,
                  amountCents: e.amountCents,
                })),
              },
            },
          });

          // Update CreatorBalance
          await tx.creatorBalance.update({
            where: { creatorId: creator.id },
            data: {
              pendingCents: { decrement: BigInt(amountToMatureCents) },
              availableCents: { increment: BigInt(amountToMatureCents) },
            },
          });
        });

        this.logger.log(`Matured $${(amountToMatureCents / 100).toFixed(2)} for creator ${creator.id} (holding: ${holdingDays}d)`);
        results.maturedCreators++;
        results.totalMaturedCents += amountToMatureCents;
      } catch (err: any) {
        this.logger.error(`Error maturing balance for creator ${creator.id}: ${err.message}`);
      }
    }

    return results;
  }
}
