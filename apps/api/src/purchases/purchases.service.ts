import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import {
  PurchaseRequest,
  TipRequest,
  PurchaseReceiptDto,
  ProblemException,
} from '@lumora/contracts';
import { LedgerEngine } from '@lumora/ledger';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Process a PPV post unlock, bundle, or tip purchase (Story E9-1)
   */
  async purchase(buyerUserId: string, dto: PurchaseRequest): Promise<PurchaseReceiptDto> {
    let grossCents = 0;
    let sellerUserId: string | null = null;
    let creatorId: string | null = null;
    const resourceType: 'post' | 'message' | 'bundle' = 'post';

    if (dto.type === 'ppv_post') {
      if (!dto.resourceId) {
        throw new ProblemException({
          type: 'https://lumora.app/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          code: 'VALIDATION_ERROR',
          detail: 'Resource ID is required for PPV post unlock.',
          requestId: '',
        });
      }

      const post = await this.prisma.post.findUnique({
        where: { id: dto.resourceId },
        include: { creator: true },
      });

      if (!post) {
        throw new ProblemException({
          type: 'https://lumora.app/errors/not-found',
          title: 'Post Not Found',
          status: 404,
          code: 'NOT_FOUND',
          detail: 'The requested post does not exist.',
          requestId: '',
        });
      }

      grossCents = post.priceCents || 0;
      sellerUserId = post.creator.userId;
      creatorId = post.creatorId;
    } else if (dto.type === 'tip') {
      grossCents = dto.amountCents || 0;
      if (!dto.sellerId) {
        throw new ProblemException({
          type: 'https://lumora.app/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          code: 'VALIDATION_ERROR',
          detail: 'Seller ID is required for tip.',
          requestId: '',
        });
      }

      const creator = await this.prisma.creatorProfile.findFirst({
        where: { OR: [{ id: dto.sellerId }, { userId: dto.sellerId }] },
      });

      if (!creator) {
        throw new ProblemException({
          type: 'https://lumora.app/errors/not-found',
          title: 'Creator Not Found',
          status: 404,
          code: 'NOT_FOUND',
          detail: 'Creator does not exist.',
          requestId: '',
        });
      }

      sellerUserId = creator.userId;
      creatorId = creator.id;
    } else {
      grossCents = dto.amountCents || 999;
      sellerUserId = dto.sellerId || buyerUserId;
    }

    if (grossCents <= 0) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'Invalid Amount',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: 'Purchase amount must be greater than zero.',
        requestId: '',
      });
    }

    // Check Fan spending limit controls (Story E7-3)
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: buyerUserId },
    });

    if (wallet) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const todayPurchases = await this.prisma.purchase.findMany({
        where: {
          buyerId: buyerUserId,
          type: { not: 'wallet_topup' },
          status: 'succeeded',
          createdAt: { gte: startOfDay },
        },
        select: { grossCents: true },
      });

      const spentToday = todayPurchases.reduce((acc, p) => acc + p.grossCents, 0);

      if (wallet.dailyLimitCents && spentToday + grossCents > wallet.dailyLimitCents) {
        throw new ProblemException({
          type: 'https://lumora.app/errors/forbidden',
          title: 'Daily Spending Limit Reached',
          status: 403,
          code: 'FORBIDDEN',
          detail: `This purchase exceeds your daily spending limit of $${(wallet.dailyLimitCents / 100).toFixed(2)}.`,
          requestId: '',
        });
      }
    }

    const idempotencyKey = `purchase_${buyerUserId}_${dto.type}_${dto.resourceId || uuidv7()}_${uuidv7()}`;

    let paymentId: string | null = null;

    if (dto.paymentSource === 'card') {
      const charge = await this.paymentsService.processDirectCharge('card', {
        amountCents: grossCents,
        currency: 'USD',
        userId: buyerUserId,
        idempotencyKey,
      });
      paymentId = charge.paymentId;
    } else {
      // Wallet payment check
      if (!wallet || wallet.balanceCents < BigInt(grossCents)) {
        throw new ProblemException({
          type: 'https://lumora.app/errors/insufficient-funds',
          title: 'Insufficient Wallet Balance',
          status: 400,
          code: 'INSUFFICIENT_FUNDS',
          detail: `Your wallet balance is insufficient ($${((Number(wallet?.balanceCents || 0)) / 100).toFixed(2)} available).`,
          requestId: '',
        });
      }
    }

    // Atomic Database Transaction: Double-Entry Ledger, Balance Materialization, Entitlement Provisioning
    const purchase = await this.prisma.$transaction(async (tx) => {
      const txId = uuidv7();

      let buyerWalletAcc = await tx.ledgerAccount.findFirst({
        where: { ownerType: 'fan_wallet', ownerId: buyerUserId },
      });
      if (!buyerWalletAcc) {
        buyerWalletAcc = await tx.ledgerAccount.create({
          data: { ownerType: 'fan_wallet', ownerId: buyerUserId, currency: 'USD' },
        });
      }

      let creatorPendingAcc = await tx.ledgerAccount.findFirst({
        where: { ownerType: 'creator', ownerId: creatorId || sellerUserId! },
      });
      if (!creatorPendingAcc) {
        creatorPendingAcc = await tx.ledgerAccount.create({
          data: { ownerType: 'creator', ownerId: creatorId || sellerUserId!, currency: 'USD' },
        });
      }

      let platformRevAcc = await tx.ledgerAccount.findFirst({
        where: { ownerType: 'platform' },
      });
      if (!platformRevAcc) {
        platformRevAcc = await tx.ledgerAccount.create({
          data: { ownerType: 'platform', currency: 'USD' },
        });
      }

      const ledgerTx = LedgerEngine.buildWalletSpendTransaction({
        transactionId: txId,
        kind: dto.type === 'tip' ? 'tip' : 'ppv_purchase',
        referenceType: 'purchase',
        referenceId: txId,
        postedAt: new Date(),
        walletAccountId: buyerWalletAcc.id,
        creatorPendingAccountId: creatorPendingAcc.id,
        platformRevenueAccountId: platformRevAcc.id,
        amountCents: BigInt(grossCents),
        currency: 'USD',
      });

      await tx.ledgerTransaction.create({
        data: {
          id: txId,
          kind: dto.type === 'tip' ? 'tip' : 'ppv_purchase',
          referenceType: 'purchase',
          referenceId: txId,
          entries: {
            create: ledgerTx.entries.map((e) => ({
              accountId: e.accountId,
              amountCents: e.amountCents,
            })),
          },
        },
      });

      // Debit fan wallet if wallet payment
      if (dto.paymentSource === 'wallet') {
        await tx.wallet.update({
          where: { userId: buyerUserId },
          data: { balanceCents: { decrement: BigInt(grossCents) } },
        });
      }

      // Increment creator pending balance (80% net)
      const creatorNetCents = BigInt(Math.round((grossCents * 80) / 100));
      if (creatorId) {
        await tx.creatorBalance.upsert({
          where: { creatorId },
          create: {
            creatorId,
            pendingCents: creatorNetCents,
            availableCents: 0n,
          },
          update: {
            pendingCents: { increment: creatorNetCents },
          },
        });
      }

      // Create purchase row
      const p = await tx.purchase.create({
        data: {
          buyerId: buyerUserId,
          sellerId: sellerUserId!,
          type: dto.type as any,
          resourceId: dto.resourceId,
          grossCents,
          feeCents: grossCents - Number(creatorNetCents),
          netCents: Number(creatorNetCents),
          currency: 'USD',
          status: 'succeeded',
          paymentId,
          idempotencyKey,
        },
      });

      // Provision entitlement for PPV content
      if (dto.type === 'ppv_post' && dto.resourceId) {
        await tx.entitlement.upsert({
          where: {
            userId_resourceType_resourceId: {
              userId: buyerUserId,
              resourceType,
              resourceId: dto.resourceId,
            },
          },
          create: {
            userId: buyerUserId,
            resourceType,
            resourceId: dto.resourceId,
            sourcePurchaseId: p.id,
          },
          update: {
            sourcePurchaseId: p.id,
          },
        });
      }

      return p;
    });

    return {
      id: purchase.id,
      type: purchase.type as any,
      resourceId: purchase.resourceId,
      grossCents: purchase.grossCents,
      feeCents: purchase.feeCents,
      netCents: purchase.netCents,
      taxCents: (purchase as any).taxCents || 0,
      currency: purchase.currency,
      status: purchase.status as any,
      createdAt: purchase.createdAt.toISOString(),
    };
  }

  /**
   * Tip a creator
   */
  async tip(buyerUserId: string, dto: TipRequest): Promise<PurchaseReceiptDto> {
    return this.purchase(buyerUserId, {
      type: 'tip',
      sellerId: dto.creatorId,
      amountCents: dto.amountCents,
      paymentSource: 'wallet',
      message: dto.message,
    });
  }
}
