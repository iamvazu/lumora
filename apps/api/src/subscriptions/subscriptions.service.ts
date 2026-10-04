import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentsService } from '../payments/payments.service.js';
import {
  SubscriptionRequest,
  CreateSubscriptionPlanRequest,
  CreatePromotionRequest,
  SubscriptionPlanDto,
  PromotionDto,
  SubscriptionDto,
  ProblemException,
} from '@lumora/contracts';
import { LedgerEngine } from '@lumora/ledger';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Get subscription plans for a creator
   */
  async getCreatorPlans(creatorUserId: string): Promise<SubscriptionPlanDto[]> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
    });

    if (!creator) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        status: 403,
        code: 'FORBIDDEN',
        title: 'Not a Creator',
        detail: 'Subscription plans are managed by creators.',
        requestId: '',
      });
    }

    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { creatorId: creator.id },
      orderBy: { periodMonths: 'asc' },
    });

    return plans.map((p) => ({
      id: p.id,
      creatorId: p.creatorId,
      tierName: p.tierName,
      periodMonths: p.periodMonths,
      priceCents: p.priceCents,
      discountPct: p.discountPct,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  /**
   * Create or update plan
   */
  async createPlan(creatorUserId: string, dto: CreateSubscriptionPlanRequest): Promise<SubscriptionPlanDto> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
    });

    if (!creator) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        status: 403,
        code: 'FORBIDDEN',
        title: 'Not a Creator',
        detail: 'Subscription plans are managed by creators.',
        requestId: '',
      });
    }

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        creatorId: creator.id,
        tierName: dto.tierName,
        periodMonths: dto.periodMonths,
        priceCents: dto.priceCents,
        discountPct: dto.discountPct,
      },
    });

    return {
      id: plan.id,
      creatorId: plan.creatorId,
      tierName: plan.tierName,
      periodMonths: plan.periodMonths,
      priceCents: plan.priceCents,
      discountPct: plan.discountPct,
      active: plan.active,
      createdAt: plan.createdAt.toISOString(),
    };
  }

  /**
   * Promotions & discount codes
   */
  async getCreatorPromotions(creatorUserId: string): Promise<PromotionDto[]> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
    });

    if (!creator) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        status: 403,
        code: 'FORBIDDEN',
        title: 'Not a Creator',
        detail: 'Promotions are managed by creators.',
        requestId: '',
      });
    }

    const promos = await this.prisma.promotion.findMany({
      where: { creatorId: creator.id },
      orderBy: { createdAt: 'desc' },
    });

    return promos.map((p) => ({
      id: p.id,
      creatorId: p.creatorId,
      kind: p.kind as any,
      trialDays: p.trialDays,
      discountPct: p.discountPct,
      maxUses: p.maxUses,
      used: p.used,
      code: p.code,
      startsAt: p.startsAt?.toISOString() || null,
      endsAt: p.endsAt?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async createPromotion(creatorUserId: string, dto: CreatePromotionRequest): Promise<PromotionDto> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId: creatorUserId },
    });

    if (!creator) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        status: 403,
        code: 'FORBIDDEN',
        title: 'Not a Creator',
        detail: 'Promotions are managed by creators.',
        requestId: '',
      });
    }

    const promo = await this.prisma.promotion.create({
      data: {
        creatorId: creator.id,
        kind: dto.kind as any,
        trialDays: dto.trialDays,
        discountPct: dto.discountPct,
        maxUses: dto.maxUses,
        code: dto.code.toUpperCase(),
        startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });

    return {
      id: promo.id,
      creatorId: promo.creatorId,
      kind: promo.kind as any,
      trialDays: promo.trialDays,
      discountPct: promo.discountPct,
      maxUses: promo.maxUses,
      used: promo.used,
      code: promo.code,
      startsAt: promo.startsAt?.toISOString() || null,
      endsAt: promo.endsAt?.toISOString() || null,
      createdAt: promo.createdAt.toISOString(),
    };
  }

  /**
   * Subscribe to a creator (Flow B / Story E8-1)
   */
  async subscribe(fanUserId: string, dto: SubscriptionRequest): Promise<SubscriptionDto> {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
      include: { creator: { include: { user: true } } },
    });

    if (!plan || plan.creatorId !== dto.creatorId) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Subscription Plan Not Found',
        detail: 'The requested subscription plan does not exist.',
        requestId: '',
      });
    }

    let finalPriceCents = plan.priceCents;
    let promoRecord: any = null;

    if (dto.promoCode) {
      promoRecord = await this.prisma.promotion.findFirst({
        where: {
          creatorId: dto.creatorId,
          code: dto.promoCode.toUpperCase(),
        },
      });

      if (promoRecord) {
        if (promoRecord.maxUses && promoRecord.used >= promoRecord.maxUses) {
          throw new ProblemException({
            type: 'https://lumora.app/errors/validation-error',
            status: 400,
            code: 'VALIDATION_ERROR',
            title: 'Promotion Exhausted',
            detail: 'This promo code has reached its maximum uses.',
            requestId: '',
          });
        }

        if (promoRecord.discountPct) {
          finalPriceCents = Math.round((finalPriceCents * (100 - promoRecord.discountPct)) / 100);
        }
      }
    }

    const idempotencyKey = `sub_${fanUserId}_${dto.creatorId}_${uuidv7()}`;

    // Execute payment and subscription provisioning
    let paymentId: string | null = null;

    if (dto.paymentMethod === 'card') {
      const charge = await this.paymentsService.processDirectCharge('card', {
        amountCents: finalPriceCents,
        currency: 'USD',
        userId: fanUserId,
        idempotencyKey,
      });
      paymentId = charge.paymentId;
    } else {
      // Wallet payment: check balance
      const wallet = await this.prisma.wallet.findUnique({
        where: { userId: fanUserId },
      });

      if (!wallet || wallet.balanceCents < BigInt(finalPriceCents)) {
        throw new ProblemException({
          type: 'https://lumora.app/errors/insufficient-funds',
          status: 400,
          code: 'INSUFFICIENT_FUNDS',
          title: 'Insufficient Wallet Balance',
          detail: 'Please top up your wallet to complete this subscription.',
          requestId: '',
        });
      }
    }

    // Database transaction: ledger split, subscription creation, balance update
    const subscription = await this.prisma.$transaction(async (tx) => {
      // 1. Double-entry ledger split
      const txId = uuidv7();

      let fanWalletAcc = await tx.ledgerAccount.findFirst({
        where: { ownerType: 'fan_wallet', ownerId: fanUserId },
      });
      if (!fanWalletAcc) {
        fanWalletAcc = await tx.ledgerAccount.create({
          data: { ownerType: 'fan_wallet', ownerId: fanUserId, currency: 'USD' },
        });
      }

      let creatorPendingAcc = await tx.ledgerAccount.findFirst({
        where: { ownerType: 'creator', ownerId: dto.creatorId },
      });
      if (!creatorPendingAcc) {
        creatorPendingAcc = await tx.ledgerAccount.create({
          data: { ownerType: 'creator', ownerId: dto.creatorId, currency: 'USD' },
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
        kind: 'subscription_charge',
        referenceType: 'subscription',
        referenceId: txId,
        postedAt: new Date(),
        walletAccountId: fanWalletAcc.id,
        creatorPendingAccountId: creatorPendingAcc.id,
        platformRevenueAccountId: platformRevAcc.id,
        amountCents: BigInt(finalPriceCents),
        currency: 'USD',
      });

      await tx.ledgerTransaction.create({
        data: {
          id: txId,
          kind: 'subscription_charge',
          referenceType: 'subscription',
          referenceId: txId,
          entries: {
            create: ledgerTx.entries.map((e) => ({
              accountId: e.accountId,
              amountCents: e.amountCents,
            })),
          },
        },
      });

      // 2. If wallet payment, debit wallet balance
      if (dto.paymentMethod === 'wallet') {
        await tx.wallet.update({
          where: { userId: fanUserId },
          data: { balanceCents: { decrement: BigInt(finalPriceCents) } },
        });
      }

      // 3. Increment creator pending balance (80% net)
      const creatorNetCents = BigInt(Math.round((finalPriceCents * 80) / 100));
      await tx.creatorBalance.upsert({
        where: { creatorId: dto.creatorId },
        create: {
          creatorId: dto.creatorId,
          pendingCents: creatorNetCents,
          availableCents: 0n,
        },
        update: {
          pendingCents: { increment: creatorNetCents },
        },
      });

      // 4. Create purchase record
      const purchase = await tx.purchase.create({
        data: {
          buyerId: fanUserId,
          sellerId: plan.creator.userId,
          type: 'subscription',
          resourceId: plan.id,
          grossCents: finalPriceCents,
          feeCents: finalPriceCents - Number(creatorNetCents),
          netCents: Number(creatorNetCents),
          currency: 'USD',
          status: 'succeeded',
          paymentId,
          idempotencyKey,
        },
      });

      // 5. Compute period dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.periodMonths);

      // 6. Upsert subscription record
      const sub = await tx.subscription.upsert({
        where: {
          id: uuidv7(),
        },
        create: {
          fanId: fanUserId,
          creatorId: dto.creatorId,
          planId: plan.id,
          promotionId: promoRecord?.id || null,
          status: 'active',
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
          autoRenew: true,
        },
        update: {
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
          status: 'active',
          autoRenew: true,
        },
      });

      // 7. Provision general creator subscription entitlement
      await tx.entitlement.upsert({
        where: {
          userId_resourceType_resourceId: {
            userId: fanUserId,
            resourceType: 'post',
            resourceId: dto.creatorId,
          },
        },
        create: {
          userId: fanUserId,
          resourceType: 'post',
          resourceId: dto.creatorId,
          sourcePurchaseId: purchase.id,
        },
        update: {
          sourcePurchaseId: purchase.id,
        },
      });

      // Increment promo use count if applicable
      if (promoRecord) {
        await tx.promotion.update({
          where: { id: promoRecord.id },
          data: { used: { increment: 1 } },
        });
      }

      return sub;
    });

    return {
      id: subscription.id,
      fanId: subscription.fanId,
      creatorId: subscription.creatorId,
      creatorHandle: plan.creator.user.handle,
      creatorDisplayName: plan.creator.user.displayName,
      creatorAvatarUrl: null,
      planId: subscription.planId,
      status: subscription.status as any,
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      autoRenew: subscription.autoRenew,
      priceCents: finalPriceCents,
      createdAt: subscription.createdAt.toISOString(),
    };
  }

  /**
   * Cancel / Toggle Auto-Renew
   */
  async toggleAutoRenew(fanUserId: string, subscriptionId: string): Promise<SubscriptionDto> {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, fanId: fanUserId },
      include: { plan: true, creator: { include: { user: true } } },
    });

    if (!sub) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Subscription Not Found',
        detail: 'Subscription record not found.',
        requestId: '',
      });
    }

    const nextAutoRenew = !sub.autoRenew;

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        autoRenew: nextAutoRenew,
        cancelledAt: nextAutoRenew ? null : new Date(),
      },
    });

    return {
      id: updated.id,
      fanId: updated.fanId,
      creatorId: updated.creatorId,
      creatorHandle: sub.creator.user.handle,
      creatorDisplayName: sub.creator.user.displayName,
      creatorAvatarUrl: null,
      planId: updated.planId,
      status: updated.status as any,
      currentPeriodStart: updated.currentPeriodStart.toISOString(),
      currentPeriodEnd: updated.currentPeriodEnd.toISOString(),
      autoRenew: updated.autoRenew,
      priceCents: sub.plan.priceCents,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Get fan's active subscriptions
   */
  async getFanSubscriptions(fanUserId: string): Promise<SubscriptionDto[]> {
    const subs = await this.prisma.subscription.findMany({
      where: { fanId: fanUserId },
      include: {
        plan: true,
        creator: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return subs.map((s) => ({
      id: s.id,
      fanId: s.fanId,
      creatorId: s.creatorId,
      creatorHandle: s.creator.user.handle,
      creatorDisplayName: s.creator.user.displayName,
      creatorAvatarUrl: null,
      planId: s.planId,
      status: s.status as any,
      currentPeriodStart: s.currentPeriodStart.toISOString(),
      currentPeriodEnd: s.currentPeriodEnd.toISOString(),
      autoRenew: s.autoRenew,
      priceCents: s.plan.priceCents,
      createdAt: s.createdAt.toISOString(),
    }));
  }
}
