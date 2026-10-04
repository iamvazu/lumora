import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PurchasesService } from '../src/purchases/purchases.service.js';

describe('PurchasesService (E9 PPV Post Unlocks & Creator Tipping)', () => {
  let service: PurchasesService;
  let mockPrisma: any;
  let mockPayments: any;

  beforeEach(() => {
    mockPrisma = {
      post: {
        findUnique: vi.fn(),
      },
      message: {
        findUnique: vi.fn(),
      },
      creatorProfile: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      entitlement: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      purchase: {
        findUnique: vi.fn(),
        aggregate: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
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
      $transaction: vi.fn(async (cb) => {
        if (typeof cb === 'function') return cb(mockPrisma);
        return Promise.all(cb);
      }),
    };

    mockPayments = {
      processDirectCharge: vi.fn().mockResolvedValue({
        paymentId: 'pay-segpay-ppv-1',
        status: 'succeeded',
        providerName: 'segpay',
      }),
    };

    service = new PurchasesService(mockPrisma, mockPayments);
  });

  it('should unlock a PPV post and provision entitlement for the fan', async () => {
    mockPrisma.post.findUnique.mockResolvedValue({
      id: 'post-100',
      creatorId: 'creator-1',
      isPpv: true,
      priceCents: 1500,
      currency: 'USD',
      creator: { userId: 'creator-user-id' },
    });

    mockPrisma.entitlement.findUnique.mockResolvedValue(null);

    mockPrisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet-1',
      userId: 'fan-1',
      balanceCents: 3000n,
      dailyLimitCents: 20000,
      monthlyLimitCents: 100000,
    });

    mockPrisma.ledgerAccount.findFirst
      .mockResolvedValueOnce({ id: 'acc-wallet' })
      .mockResolvedValueOnce({ id: 'acc-creator' })
      .mockResolvedValueOnce({ id: 'acc-platform' });

    mockPrisma.purchase.create.mockResolvedValue({
      id: 'pur-1',
      buyerId: 'fan-1',
      sellerId: 'creator-user-id',
      type: 'ppv_post',
      resourceId: 'post-100',
      grossCents: 1500,
      feeCents: 300,
      netCents: 1200,
      currency: 'USD',
      status: 'succeeded',
      createdAt: new Date(),
    });

    const res = await service.purchase('fan-1', {
      type: 'ppv_post',
      resourceId: 'post-100',
      paymentSource: 'wallet',
    });

    expect(res.status).toBe('succeeded');
    expect(res.grossCents).toBe(1500);
    expect(mockPrisma.entitlement.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: 'fan-1',
          resourceType: 'post',
          resourceId: 'post-100',
        }),
      }),
    );
    expect(mockPrisma.creatorBalance.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          pendingCents: 1200n, // 80% net
        }),
      }),
    );
  });

  it('should process a creator tip with custom message', async () => {
    mockPrisma.creatorProfile.findFirst.mockResolvedValue({
      id: 'creator-1',
      userId: 'creator-user-id',
    });

    mockPrisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet-1',
      userId: 'fan-1',
      balanceCents: 5000n,
      dailyLimitCents: 20000,
      monthlyLimitCents: 100000,
    });

    mockPrisma.ledgerAccount.findFirst
      .mockResolvedValueOnce({ id: 'acc-wallet' })
      .mockResolvedValueOnce({ id: 'acc-creator' })
      .mockResolvedValueOnce({ id: 'acc-platform' });

    mockPrisma.purchase.create.mockResolvedValue({
      id: 'pur-tip-1',
      buyerId: 'fan-1',
      sellerId: 'creator-user-id',
      type: 'tip',
      grossCents: 2500,
      feeCents: 500,
      netCents: 2000,
      currency: 'USD',
      status: 'succeeded',
      createdAt: new Date(),
    });

    const res = await service.tip('fan-1', {
      creatorId: 'creator-1',
      amountCents: 2500,
      message: 'Love your latest video set!',
    });

    expect(res.status).toBe('succeeded');
    expect(res.grossCents).toBe(2500);
    expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'fan-1' },
        data: { balanceCents: { decrement: 2500n } },
      }),
    );
  });
});
