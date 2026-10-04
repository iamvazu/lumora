import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubscriptionRebillProcessor } from '../src/processors/subscription-rebill.processor.js';

describe('SubscriptionRebillProcessor (E7/E8 Hourly Rebill Engine)', () => {
  let processor: SubscriptionRebillProcessor;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      subscription: {
        findMany: vi.fn(),
        update: vi.fn(),
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
        deleteMany: vi.fn(),
      },
      $transaction: vi.fn(async (cbOrArray) => {
        if (typeof cbOrArray === 'function') return cbOrArray(mockPrisma);
        return Promise.all(cbOrArray);
      }),
    };

    processor = new SubscriptionRebillProcessor();
    (processor as any).prisma = mockPrisma;
  });

  it('should renew an active subscription due for rebill using wallet balance', async () => {
    mockPrisma.subscription.findMany.mockResolvedValue([
      {
        id: 'sub-1',
        fanId: 'fan-1',
        creatorId: 'creator-1',
        planId: 'plan-1',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() - 1000), // Due in the past
        autoRenew: true,
        fan: {
          wallet: {
            balanceCents: 5000n,
          },
        },
        creator: {
          userId: 'creator-user-id',
        },
        plan: {
          priceCents: 1500,
          periodMonths: 1,
        },
      },
    ]);

    mockPrisma.ledgerAccount.findFirst
      .mockResolvedValueOnce({ id: 'acc-fan' })
      .mockResolvedValueOnce({ id: 'acc-creator' })
      .mockResolvedValueOnce({ id: 'acc-platform' });

    const results = await processor.processDueSubscriptions();

    expect(results.renewed).toBe(1);
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sub-1' },
        data: expect.objectContaining({ status: 'active' }),
      }),
    );
    expect(mockPrisma.wallet.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'fan-1' },
        data: { balanceCents: { decrement: 1500n } },
      }),
    );
  });

  it('should transition to past_due on first payment failure', async () => {
    mockPrisma.subscription.findMany.mockResolvedValue([
      {
        id: 'sub-2',
        fanId: 'fan-2',
        creatorId: 'creator-1',
        planId: 'plan-1',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() - 1000),
        autoRenew: true,
        fan: {
          wallet: {
            balanceCents: 500n, // Insufficient wallet balance (< 2000)
          },
        },
        creator: { userId: 'creator-user-id' },
        plan: { priceCents: 2000, periodMonths: 1 },
      },
    ]);

    const results = await processor.processDueSubscriptions('fan-2');

    expect(results.pastDue).toBe(1);
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-2' },
      data: { status: 'past_due' },
    });
  });

  it('should expire and revoke entitlements when already past_due and failed again', async () => {
    mockPrisma.subscription.findMany.mockResolvedValue([
      {
        id: 'sub-3',
        fanId: 'fan-3',
        creatorId: 'creator-1',
        planId: 'plan-1',
        status: 'past_due',
        currentPeriodEnd: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        autoRenew: true,
        fan: {
          wallet: {
            balanceCents: 100n,
          },
        },
        creator: { userId: 'creator-user-id' },
        plan: { priceCents: 2000, periodMonths: 1 },
      },
    ]);

    const results = await processor.processDueSubscriptions('fan-3');

    expect(results.expired).toBe(1);
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-3' },
      data: { status: 'expired' },
    });
    expect(mockPrisma.entitlement.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'fan-3',
        resourceType: 'post',
        resourceId: 'creator-1',
      },
    });
  });
});
