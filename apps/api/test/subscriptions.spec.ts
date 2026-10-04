import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubscriptionsService } from '../src/subscriptions/subscriptions.service.js';

describe('SubscriptionsService (E7 Subscriptions Engine)', () => {
  let service: SubscriptionsService;
  let mockPrisma: any;
  let mockPayments: any;

  beforeEach(() => {
    mockPrisma = {
      creatorProfile: {
        findUnique: vi.fn(),
      },
      subscriptionPlan: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      promotion: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      subscription: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        findMany: vi.fn(),
      },
      wallet: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      creatorBalance: {
        upsert: vi.fn(),
      },
      ledgerAccount: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      ledgerTransaction: {
        create: vi.fn(),
      },
      purchase: {
        create: vi.fn(),
      },
      entitlement: {
        upsert: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => {
        if (typeof cb === 'function') return cb(mockPrisma);
        return Promise.all(cb);
      }),
    };

    mockPayments = {
      processDirectCharge: vi.fn().mockResolvedValue({
        paymentId: 'pay-ccbill-sub-1',
        status: 'succeeded',
        providerName: 'ccbill',
      }),
    };

    service = new SubscriptionsService(mockPrisma, mockPayments);
  });

  it('should create a subscription plan tier for a creator', async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({ id: 'creator-1' });
    mockPrisma.subscriptionPlan.create.mockResolvedValue({
      id: 'plan-1',
      creatorId: 'creator-1',
      tierName: 'VIP Monthly Access',
      priceCents: 1500,
      currency: 'USD',
      periodMonths: 1,
      discountPct: null,
      active: true,
      createdAt: new Date(),
    });

    const res = await service.createPlan('user-creator-1', {
      tierName: 'VIP Monthly Access',
      priceCents: 1500,
      periodMonths: 1,
    });

    expect(res.tierName).toBe('VIP Monthly Access');
    expect(res.priceCents).toBe(1500);
  });

  it('should subscribe a fan using fan wallet balance with promo discount', async () => {
    mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({
      id: 'plan-1',
      creatorId: 'creator-1',
      tierName: 'VIP Tier',
      priceCents: 2000,
      periodMonths: 1,
      active: true,
      creator: {
        id: 'creator-1',
        userId: 'creator-user-id',
        user: { handle: 'creatorstar', displayName: 'Creator Star' },
      },
    });

    mockPrisma.promotion.findFirst.mockResolvedValue({
      id: 'promo-1',
      code: 'WELCOME50',
      discountPct: 50, // 50% off -> 1000 cents
      used: 0,
      maxUses: 100,
    });

    mockPrisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet-fan',
      userId: 'fan-1',
      balanceCents: 5000n,
    });

    mockPrisma.ledgerAccount.findFirst
      .mockResolvedValueOnce({ id: 'acc-fan' })
      .mockResolvedValueOnce({ id: 'acc-creator' })
      .mockResolvedValueOnce({ id: 'acc-platform' });

    mockPrisma.purchase.create.mockResolvedValue({
      id: 'pur-sub-1',
    });

    mockPrisma.subscription.upsert.mockResolvedValue({
      id: 'sub-1',
      fanId: 'fan-1',
      creatorId: 'creator-1',
      planId: 'plan-1',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      autoRenew: true,
      createdAt: new Date(),
    });

    const res = await service.subscribe('fan-1', {
      creatorId: 'creator-1',
      planId: 'plan-1',
      paymentMethod: 'wallet',
      promoCode: 'WELCOME50',
    });

    expect(res.id).toBe('sub-1');
    expect(res.status).toBe('active');
    expect(res.priceCents).toBe(1000); // 50% discount
    expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'fan-1' },
        data: { balanceCents: { decrement: 1000n } },
      }),
    );
    expect(mockPrisma.creatorBalance.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ pendingCents: 800n }), // 80% of 1000 cents
      }),
    );
  });

  it('should toggle auto-renew cancellation', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub-1',
      fanId: 'fan-1',
      autoRenew: true,
      plan: { priceCents: 1500 },
      creator: {
        user: { displayName: 'Creator Star', handle: 'creatorstar' },
      },
    });

    mockPrisma.subscription.update.mockResolvedValue({
      id: 'sub-1',
      fanId: 'fan-1',
      creatorId: 'creator-1',
      planId: 'plan-1',
      autoRenew: false,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 3600 * 1000),
      createdAt: new Date(),
    });

    const res = await service.toggleAutoRenew('fan-1', 'sub-1');
    expect(res.autoRenew).toBe(false);
  });
});
