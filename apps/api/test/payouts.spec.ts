import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PayoutsService } from '../src/payouts/payouts.service.js';

describe('PayoutsService (E12 Creator Payouts & Statements)', () => {
  let service: PayoutsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      creatorProfile: {
        findUnique: vi.fn(),
      },
      taxProfile: {
        findFirst: vi.fn(),
      },
      moderationCase: {
        findFirst: vi.fn(),
      },
      payoutMethod: {
        findMany: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
      },
      payout: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      creatorBalance: {
        update: vi.fn(),
      },
      purchase: {
        findMany: vi.fn(),
      },
      ledgerAccount: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      ledgerTransaction: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cbOrArray) => {
        if (typeof cbOrArray === 'function') return cbOrArray(mockPrisma);
        return Promise.all(cbOrArray);
      }),
    };

    service = new PayoutsService(mockPrisma);
  });

  it('should return 7-day holding period for new creators and 3-day for mature creators', async () => {
    // New creator (30 days old)
    mockPrisma.creatorProfile.findUnique.mockResolvedValueOnce({
      id: 'creator-new',
      status: 'approved',
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      creatorBalance: { pendingCents: 50000n, availableCents: 30000n },
    });
    mockPrisma.taxProfile.findFirst.mockResolvedValueOnce({ id: 'tax-1' });
    mockPrisma.moderationCase.findFirst.mockResolvedValueOnce(null);

    const resNew = await service.getCreatorBalance('user-creator-new');
    expect(resNew.holdingDays).toBe(7);
    expect(resNew.canRequestPayout).toBe(true);

    // Mature creator (120 days old)
    mockPrisma.creatorProfile.findUnique.mockResolvedValueOnce({
      id: 'creator-mature',
      status: 'approved',
      createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000),
      creatorBalance: { pendingCents: 50000n, availableCents: 30000n },
    });
    mockPrisma.taxProfile.findFirst.mockResolvedValueOnce({ id: 'tax-2' });
    mockPrisma.moderationCase.findFirst.mockResolvedValueOnce(null);

    const resMature = await service.getCreatorBalance('user-creator-mature');
    expect(resMature.holdingDays).toBe(3);
  });

  it('should block payout requests if payout method was added within 72h cooldown', async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({
      id: 'creator-1',
      creatorBalance: { availableCents: 50000n },
    });

    // Payout method added 2 hours ago
    mockPrisma.payoutMethod.findFirst.mockResolvedValue({
      id: 'method-new',
      creatorId: 'user-creator-1',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000),
    });

    await expect(
      service.requestPayout('user-creator-1', {
        methodId: 'method-new',
        amountCents: 10000,
        currency: 'USD',
      }),
    ).rejects.toThrow();
  });

  it('should flag payouts >= $10,000 for manual review and execute double-entry ledger entry', async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({
      id: 'creator-1',
      creatorBalance: { availableCents: 2000000n }, // $20,000 available
    });

    // Payout method added 5 days ago (mature)
    mockPrisma.payoutMethod.findFirst.mockResolvedValue({
      id: 'method-verified',
      creatorId: 'user-creator-1',
      provider: 'payoneer',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    });

    mockPrisma.ledgerAccount.findFirst
      .mockResolvedValueOnce({ id: 'acc-creator-avail' })
      .mockResolvedValueOnce({ id: 'acc-processor-payout' });

    mockPrisma.payout.create.mockResolvedValue({
      id: 'payout-10k',
      creatorId: 'user-creator-1',
      methodId: 'method-verified',
      amountCents: 1500000, // $15,000
      currency: 'USD',
      status: 'requested',
      providerRef: 'payout_abc',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await service.requestPayout('user-creator-1', {
      methodId: 'method-verified',
      amountCents: 1500000,
      currency: 'USD',
    });

    expect(res.manualReviewRequired).toBe(true);
    expect(res.status).toBe('requested');
    expect(mockPrisma.creatorBalance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { availableCents: { decrement: 1500000n } },
      }),
    );
    expect(mockPrisma.ledgerTransaction.create).toHaveBeenCalled();
  });
});
