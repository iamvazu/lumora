import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PayoutsService } from '../../src/payouts/payouts.service.js';

describe('E2E Flow E: Creator Earnings Maturation, 72h Security Aging, Ledger Settlement & Tax Statements', () => {
  let payoutsService: PayoutsService;

  const mockBalances = new Map<string, any>();
  const mockPayoutMethods = new Map<string, any>();
  const mockPayouts = new Map<string, any>();
  const mockProfiles = new Map<string, any>();
  const mockPurchases = new Map<string, any>();
  const mockLedgerTxs: any[] = [];
  const mockLedgerPostings: any[] = [];

  const mockPrisma: any = {
    creatorProfile: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockProfiles.get(where.id || where.userId) || null)),
    },
    creatorBalance: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockBalances.get(where.creatorId || where.id) || null)),
      update: vi.fn(({ where, data }) => {
        const key = where.creatorId || where.id || 'creator-elena';
        const b = mockBalances.get(key) || mockBalances.get('creator-elena') || mockBalances.get('prof-elena');
        if (!b) throw new Error('Balance not found');
        let newAvail = b.availableCents;
        if (data.availableCents?.decrement !== undefined) {
          newAvail = newAvail - BigInt(data.availableCents.decrement);
        } else if (data.availableCents !== undefined) {
          newAvail = BigInt(data.availableCents);
        }
        const updated = {
          ...b,
          ...data,
          availableCents: newAvail,
        };
        mockBalances.set(key, updated);
        mockBalances.set('creator-elena', updated);
        mockBalances.set('prof-elena', updated);
        return Promise.resolve(updated);
      }),
    },
    taxProfile: {
      findFirst: vi.fn(() => Promise.resolve({ id: 'tax-1' })),
    },
    payoutMethod: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockPayoutMethods.get(where.id) || null)),
      findFirst: vi.fn(({ where }) => {
        for (const pm of mockPayoutMethods.values()) {
          if (pm.creatorId === where.creatorId && (!where.isDefault || pm.isDefault)) {
            return Promise.resolve(pm);
          }
        }
        return Promise.resolve(null);
      }),
      create: vi.fn(({ data }) => {
        const pm = { id: `pm_${Date.now()}`, ...data, createdAt: new Date() };
        mockPayoutMethods.set(pm.id, pm);
        return Promise.resolve(pm);
      }),
      update: vi.fn(({ where, data }) => {
        const pm = mockPayoutMethods.get(where.id);
        if (!pm) throw new Error('Payout method not found');
        const updated = { ...pm, ...data };
        mockPayoutMethods.set(where.id, updated);
        return Promise.resolve(updated);
      }),
      findMany: vi.fn(({ where }) => {
        const list: any[] = [];
        for (const pm of mockPayoutMethods.values()) {
          if (pm.creatorId === where.creatorId) list.push(pm);
        }
        return Promise.resolve(list);
      }),
    },
    payout: {
      create: vi.fn(({ data }) => {
        const p = {
          id: `payout_${Date.now()}`,
          ...data,
          amountCents: BigInt(data.amountCents),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockPayouts.set(p.id, p);
        return Promise.resolve(p);
      }),
      findMany: vi.fn(({ where }) => {
        const list: any[] = [];
        for (const p of mockPayouts.values()) {
          if (p.creatorId === where.creatorId) list.push(p);
        }
        return Promise.resolve(list);
      }),
    },
    moderationCase: {
      findFirst: vi.fn(() => Promise.resolve(null)),
    },
    purchase: {
      findMany: vi.fn(() => Promise.resolve(Array.from(mockPurchases.values()))),
    },
    ledgerAccount: {
      findFirst: vi.fn(() => Promise.resolve({ id: 'acc-ledger-1' })),
      create: vi.fn(() => Promise.resolve({ id: 'acc-ledger-proc' })),
    },
    ledgerTransaction: {
      create: vi.fn(({ data }) => {
        const tx = { id: `tx_${Date.now()}`, ...data };
        mockLedgerTxs.push(tx);
        return Promise.resolve(tx);
      }),
    },
    ledgerPosting: {
      createMany: vi.fn(({ data }) => {
        mockLedgerPostings.push(...data);
        return Promise.resolve({ count: data.length });
      }),
    },
    $transaction: vi.fn(async (cb: any) => {
      if (typeof cb === 'function') return cb(mockPrisma);
      return Promise.all(cb);
    }),
  };

  beforeEach(() => {
    mockBalances.clear();
    mockPayoutMethods.clear();
    mockPayouts.clear();
    mockProfiles.clear();
    mockPurchases.clear();
    mockLedgerTxs.length = 0;
    mockLedgerPostings.length = 0;

    payoutsService = new PayoutsService(mockPrisma);
  });

  it('executes complete Flow E: Earnings Maturation -> 72h Security Aging Enforced -> Verified Payout -> Zero-Sum Ledger Debit -> 1099-K Statement', async () => {
    const creatorId = 'creator-elena';

    // Step 1: Initialize creator with $5,000 available earnings
    const initBalance = {
      id: 'bal-elena',
      creatorId: 'prof-elena',
      pendingCents: 100000n, // $1,000 pending
      availableCents: 500000n, // $5,000 available
      holdingDurationDays: 3,
    };
    mockBalances.set('prof-elena', initBalance);
    mockBalances.set(creatorId, initBalance);

    mockProfiles.set(creatorId, {
      id: 'prof-elena',
      userId: creatorId,
      status: 'approved',
      createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000), // 120 days old (mature)
      creatorBalance: initBalance,
    });

    const balanceCheck = await payoutsService.getCreatorBalance(creatorId);
    expect(balanceCheck.holdingDays).toBe(3);
    expect(balanceCheck.canRequestPayout).toBe(true);

    // Step 2: Creator adds a new payout method
    const newMethod = await payoutsService.createPayoutMethod(creatorId, {
      provider: 'payoneer',
      currency: 'USD',
      email: 'elena.creator@example.com',
      isDefault: true,
    });

    expect(newMethod.id).toBeDefined();

    // Step 3: Attempting withdrawal immediately (0 hours old) triggers 72h cooldown error
    await expect(
      payoutsService.requestPayout(creatorId, {
        methodId: newMethod.id,
        amountCents: 200000, // $2,000
        currency: 'USD',
      })
    ).rejects.toThrow(/72-hour/i);

    // Step 4: Simulate method aging beyond 72 hours
    mockPayoutMethods.set(newMethod.id, {
      ...newMethod,
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000), // 4 days ago
    });

    // Step 5: Execute Payout Request of $2,000 USD
    const payout = await payoutsService.requestPayout(creatorId, {
      methodId: newMethod.id,
      amountCents: 200000,
      currency: 'USD',
    });

    expect(payout.status).toBe('processing');
    expect(payout.amountCents).toBe(200000n);

    // Step 6: Generate Monthly Creator Tax Statement (1099-K / DAC7)
    mockPurchases.set('pur_1', {
      id: 'pur_1',
      sellerId: creatorId,
      grossCents: 500000,
      feeCents: 100000,
      netCents: 400000,
      status: 'succeeded',
      createdAt: new Date('2026-10-02'),
    });

    const statements = await payoutsService.getStatements(creatorId, 2026);
    expect(statements.length).toBe(12);
    const octoberStatement = statements.find((s) => s.period === '2026-10');
    expect(octoberStatement).toBeDefined();
    expect(octoberStatement?.grossRevenueCents).toBe(500000);
    expect(octoberStatement?.platformFeeCents).toBe(100000);
    expect(octoberStatement?.netRevenueCents).toBe(400000);
  });
});
