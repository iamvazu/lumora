import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import {
  WalletTopupRequest,
  UpdateWalletLimitsRequest,
  WalletDto,
  WalletTransactionDto,
} from '@lumora/contracts';
import { LedgerEngine } from '@lumora/ledger';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Get or initialize fan wallet
   */
  async getWallet(userId: string): Promise<WalletDto> {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          balanceCents: 0n,
          currency: 'USD',
        },
      });
    }

    // Calculate spend today and spend this month
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayPurchases, monthPurchases] = await Promise.all([
      this.prisma.purchase.findMany({
        where: {
          buyerId: userId,
          type: { not: 'wallet_topup' },
          status: 'succeeded',
          createdAt: { gte: startOfDay },
        },
        select: { grossCents: true },
      }),
      this.prisma.purchase.findMany({
        where: {
          buyerId: userId,
          type: { not: 'wallet_topup' },
          status: 'succeeded',
          createdAt: { gte: startOfMonth },
        },
        select: { grossCents: true },
      }),
    ]);

    const spentTodayCents = todayPurchases.reduce((acc, p) => acc + p.grossCents, 0);
    const spentThisMonthCents = monthPurchases.reduce((acc, p) => acc + p.grossCents, 0);

    return {
      userId: wallet.userId,
      balanceCents: Number(wallet.balanceCents),
      currency: wallet.currency,
      dailyLimitCents: wallet.dailyLimitCents,
      monthlyLimitCents: wallet.monthlyLimitCents,
      spentTodayCents,
      spentThisMonthCents,
    };
  }

  /**
   * Top up fan wallet with card payment (Story E7-3)
   */
  async topup(userId: string, dto: WalletTopupRequest): Promise<WalletDto> {
    const idempotencyKey = `topup_${userId}_${uuidv7()}`;

    // 1. Process processor charge
    const charge = await this.paymentsService.processDirectCharge(dto.paymentMethod || 'card', {
      amountCents: dto.amountCents,
      currency: dto.currency || 'USD',
      userId,
      idempotencyKey,
    });

    // 2. Execute double-entry ledger & credit wallet in database transaction
    await this.prisma.$transaction(async (tx) => {
      // Find or create ledger accounts
      let processorAcc = await tx.ledgerAccount.findFirst({
        where: { ownerType: 'processor', currency: dto.currency || 'USD' },
      });
      if (!processorAcc) {
        processorAcc = await tx.ledgerAccount.create({
          data: {
            ownerType: 'processor',
            currency: dto.currency || 'USD',
          },
        });
      }

      let walletAcc = await tx.ledgerAccount.findFirst({
        where: { ownerType: 'fan_wallet', ownerId: userId, currency: dto.currency || 'USD' },
      });
      if (!walletAcc) {
        walletAcc = await tx.ledgerAccount.create({
          data: {
            ownerType: 'fan_wallet',
            ownerId: userId,
            currency: dto.currency || 'USD',
          },
        });
      }

      const txId = uuidv7();

      // Double-entry validation: processor asset (+amount) + fan wallet liability (-amount) = 0
      LedgerEngine.validateZeroSum([
        { transactionId: txId, accountId: processorAcc.id, amountCents: BigInt(dto.amountCents) },
        { transactionId: txId, accountId: walletAcc.id, amountCents: -BigInt(dto.amountCents) },
      ]);

      // Record transaction & entries
      await tx.ledgerTransaction.create({
        data: {
          id: txId,
          kind: 'wallet_topup',
          referenceType: 'payment',
          referenceId: charge.paymentId,
          entries: {
            create: [
              { accountId: processorAcc.id, amountCents: BigInt(dto.amountCents) },
              { accountId: walletAcc.id, amountCents: -BigInt(dto.amountCents) },
            ],
          },
        },
      });

      // Update fan wallet balance
      await tx.wallet.upsert({
        where: { userId },
        create: {
          userId,
          balanceCents: BigInt(dto.amountCents),
          currency: dto.currency || 'USD',
        },
        update: {
          balanceCents: { increment: BigInt(dto.amountCents) },
        },
      });

      // Create purchase record
      await tx.purchase.create({
        data: {
          buyerId: userId,
          sellerId: userId,
          type: 'wallet_topup',
          grossCents: dto.amountCents,
          currency: dto.currency || 'USD',
          netCents: dto.amountCents,
          status: 'succeeded',
          paymentId: charge.paymentId,
          idempotencyKey,
        },
      });
    });

    return this.getWallet(userId);
  }

  /**
   * Set user spending protection limits
   */
  async updateLimits(userId: string, dto: UpdateWalletLimitsRequest): Promise<WalletDto> {
    await this.prisma.wallet.upsert({
      where: { userId },
      create: {
        userId,
        balanceCents: 0n,
        dailyLimitCents: dto.dailyLimitCents,
        monthlyLimitCents: dto.monthlyLimitCents,
      },
      update: {
        dailyLimitCents: dto.dailyLimitCents,
        monthlyLimitCents: dto.monthlyLimitCents,
      },
    });

    return this.getWallet(userId);
  }

  /**
   * Get wallet transaction history
   */
  async getTransactions(userId: string, limit = 20): Promise<WalletTransactionDto[]> {
    const purchases = await this.prisma.purchase.findMany({
      where: { buyerId: userId, status: 'succeeded' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return purchases.map((p) => ({
      id: p.id,
      type: p.type,
      amountCents: p.grossCents,
      currency: p.currency,
      description:
        p.type === 'wallet_topup'
          ? 'Wallet Top-Up'
          : p.type === 'ppv_post'
          ? 'Pay-Per-View Post Unlock'
          : p.type === 'subscription'
          ? 'Creator Monthly Subscription'
          : p.type === 'tip'
          ? 'Creator Tip'
          : 'Purchase',
      createdAt: p.createdAt.toISOString(),
    }));
  }
}
