import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MassMessageProcessor } from '../src/processors/mass-message.processor.js';

describe('MassMessageProcessor (E10 Mass Message Fan-out)', () => {
  let processor: MassMessageProcessor;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      massMessage: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
      userBlock: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      subscription: {
        findMany: vi.fn(),
      },
      conversation: {
        upsert: vi.fn().mockResolvedValue({ id: 'conv-100' }),
      },
      message: {
        create: vi.fn().mockResolvedValue({ id: 'msg-fanout-1' }),
      },
      $transaction: vi.fn(async (cbOrArray) => {
        if (typeof cbOrArray === 'function') return cbOrArray(mockPrisma);
        return Promise.all(cbOrArray);
      }),
    };

    processor = new MassMessageProcessor();
    (processor as any).prisma = mockPrisma;
  });

  it('should fan-out a mass message to active subscribers excluding blocked fans', async () => {
    mockPrisma.massMessage.findMany.mockResolvedValue([
      {
        id: 'mm-1',
        creatorId: 'creator-1',
        creator: { userId: 'creator-user-id' },
        body: 'VIP Alert: Live stream starting in 1 hour!',
        priceCents: null,
        audienceFilter: { segment: 'all_subscribers' },
        scheduledAt: null,
      },
    ]);

    // 3 active subscribers
    mockPrisma.subscription.findMany.mockResolvedValue([
      { fanId: 'fan-1' },
      { fanId: 'fan-2' },
      { fanId: 'fan-blocked' },
    ]);

    // fan-blocked is blocked by creator
    mockPrisma.userBlock.findMany.mockResolvedValue([
      { blockerId: 'creator-user-id', blockedId: 'fan-blocked' },
    ]);

    const results = await processor.processPendingMassMessages();

    expect(results.processed).toBe(1);
    expect(results.totalRecipients).toBe(2); // fan-1 and fan-2 (fan-blocked excluded)
    expect(results.totalSent).toBe(2);
    expect(mockPrisma.massMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'mm-1' },
        data: expect.objectContaining({ status: 'completed', sentCount: 2 }),
      }),
    );
  });
});
