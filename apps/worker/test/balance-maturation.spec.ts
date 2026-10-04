import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BalanceMaturationProcessor } from '../src/processors/balance-maturation.processor.js';

describe('BalanceMaturationProcessor (E12 Balance Maturation Holding Policy)', () => {
  let processor: BalanceMaturationProcessor;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      creatorProfile: {
        findMany: vi.fn(),
      },
      purchase: {
        findMany: vi.fn(),
      },
      creatorBalance: {
        update: vi.fn(),
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

    processor = new BalanceMaturationProcessor();
    (processor as any).prisma = mockPrisma;
  });

  it('should mature creator pending funds older than holding period', async () => {
    const matureCreatedAt = new Date(Date.now() - 100 * 24 * 3600 * 1000); // Mature creator (3 days holding)
    mockPrisma.creatorProfile.findMany.mockResolvedValue([
      {
        id: 'creator-1',
        userId: 'creator-user-id',
        createdAt: matureCreatedAt,
        creatorBalance: {
          pendingCents: 10000n,
          availableCents: 5000n,
        },
      },
    ]);

    // Eligible mature purchases
    mockPrisma.purchase.findMany.mockResolvedValue([
      { id: 'pur-1', netCents: 4000 },
      { id: 'pur-2', netCents: 4000 },
    ]);

    mockPrisma.ledgerAccount.findFirst
      .mockResolvedValueOnce({ id: 'acc-pending' })
      .mockResolvedValueOnce({ id: 'acc-available' });

    const results = await processor.processMaturingBalances();

    expect(results.evaluated).toBe(1);
    expect(results.maturedCreators).toBe(1);
    expect(results.totalMaturedCents).toBe(8000);
    expect(mockPrisma.creatorBalance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { creatorId: 'creator-1' },
        data: {
          pendingCents: { decrement: 8000n },
          availableCents: { increment: 8000n },
        },
      }),
    );
    expect(mockPrisma.ledgerTransaction.create).toHaveBeenCalled();
  });
});
