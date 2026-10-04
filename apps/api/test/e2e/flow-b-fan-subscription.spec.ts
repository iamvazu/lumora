import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubscriptionsService } from '../../src/subscriptions/subscriptions.service.js';
import { WalletService } from '../../src/wallet/wallet.service.js';
import { AgeService } from '../../src/age/age.service.js';

describe('E2E Flow B: Fan Age Verification & Subscription Lifecycle', () => {
  let ageService: AgeService;
  let walletService: WalletService;
  let subscriptionsService: SubscriptionsService;

  const mockWallets = new Map<string, any>();
  const mockSubscriptions = new Map<string, any>();
  const mockPlans = new Map<string, any>();
  const mockCreators = new Map<string, any>();
  const mockVerifications = new Map<string, any>();

  const mockPrisma: any = {
    verification: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockVerifications.get(where.id) || null)),
      findFirst: vi.fn(({ where }) => {
        for (const v of mockVerifications.values()) {
          if (v.userId === where.userId) return Promise.resolve(v);
        }
        return Promise.resolve(null);
      }),
      create: vi.fn(({ data }) => {
        const entry = { id: `av_${Date.now()}`, ...data, createdAt: new Date() };
        mockVerifications.set(entry.id, entry);
        return Promise.resolve(entry);
      }),
      update: vi.fn(({ where, data }) => {
        const v = mockVerifications.get(where.id);
        if (!v) throw new Error('Verification not found');
        const updated = { ...v, ...data };
        mockVerifications.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    user: {
      findUnique: vi.fn(({ where }) => Promise.resolve({ id: where.id, isAgeVerified: true })),
      update: vi.fn(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
    },
    wallet: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockWallets.get(where.userId) || null)),
      create: vi.fn(({ data }) => {
        const w = { id: `wal_${Date.now()}`, ...data, balanceCents: BigInt(data.balanceCents || 0) };
        mockWallets.set(data.userId, w);
        return Promise.resolve(w);
      }),
      upsert: vi.fn(({ where, update, create }) => {
        const existing = mockWallets.get(where.userId);
        if (existing) {
          let newBal = existing.balanceCents;
          if (update.balanceCents?.decrement !== undefined) {
            newBal = newBal - BigInt(update.balanceCents.decrement);
          } else if (update.balanceCents?.increment !== undefined) {
            newBal = newBal + BigInt(update.balanceCents.increment);
          } else if (update.balanceCents !== undefined) {
            newBal = BigInt(update.balanceCents);
          }
          const updated = { ...existing, ...update, balanceCents: newBal };
          mockWallets.set(where.userId, updated);
          return Promise.resolve(updated);
        }
        const created = { id: `wal_${Date.now()}`, ...create, balanceCents: BigInt(create.balanceCents || 0) };
        mockWallets.set(where.userId, created);
        return Promise.resolve(created);
      }),
      update: vi.fn(({ where, data }) => {
        const w = mockWallets.get(where.userId);
        if (!w) throw new Error('Wallet not found');
        let newBal = w.balanceCents;
        if (data.balanceCents?.decrement !== undefined) {
          newBal = newBal - BigInt(data.balanceCents.decrement);
        } else if (data.balanceCents?.increment !== undefined) {
          newBal = newBal + BigInt(data.balanceCents.increment);
        } else if (data.balanceCents !== undefined) {
          newBal = BigInt(data.balanceCents);
        }
        const updated = { ...w, ...data, balanceCents: newBal };
        mockWallets.set(where.userId, updated);
        return Promise.resolve(updated);
      }),
    },
    subscriptionPlan: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockPlans.get(where.id) || null)),
      findFirst: vi.fn(({ where }) => {
        for (const p of mockPlans.values()) {
          if (p.creatorId === where.creatorId && p.isDefault) return Promise.resolve(p);
        }
        return Promise.resolve(null);
      }),
    },
    subscription: {
      findFirst: vi.fn(({ where }) => {
        for (const s of mockSubscriptions.values()) {
          if (s.fanId === where.fanId && s.creatorId === where.creatorId && s.status === where.status) {
            return Promise.resolve(s);
          }
        }
        return Promise.resolve(null);
      }),
      create: vi.fn(({ data }) => {
        const sub = {
          id: `sub_${Date.now()}`,
          ...data,
          currentPeriodStart: data.currentPeriodStart || new Date(),
          currentPeriodEnd: data.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 3600 * 1000),
          createdAt: new Date(),
        };
        mockSubscriptions.set(sub.id, sub);
        return Promise.resolve(sub);
      }),
      upsert: vi.fn(({ where, update, create }) => {
        const sub = {
          id: where.id || `sub_${Date.now()}`,
          fanId: create?.fanId || 'fan-bob',
          creatorId: create?.creatorId || 'creator-alice',
          planId: create?.planId || 'plan-monthly-alice',
          status: 'active',
          currentPeriodStart: create?.currentPeriodStart || update?.currentPeriodStart || new Date(),
          currentPeriodEnd: create?.currentPeriodEnd || update?.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 3600 * 1000),
          autoRenew: true,
          createdAt: new Date(),
        };
        mockSubscriptions.set(sub.id, sub);
        return Promise.resolve(sub);
      }),
      update: vi.fn(({ where, data }) => {
        const s = mockSubscriptions.get(where.id);
        if (!s) throw new Error('Subscription not found');
        const updated = { ...s, ...data };
        mockSubscriptions.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    creatorProfile: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockCreators.get(where.userId || where.id) || null)),
    },
    entitlement: {
      findUnique: vi.fn(() => Promise.resolve(null)),
      findMany: vi.fn(() => Promise.resolve([])),
      upsert: vi.fn(({ create }) => Promise.resolve({ id: `ent_${Date.now()}`, ...create })),
    },
    creatorBalance: {
      upsert: vi.fn(({ where, update, create }) => Promise.resolve({ creatorId: where.creatorId, pendingCents: 1199n, availableCents: 0n })),
    },
    ledgerAccount: {
      findFirst: vi.fn(() => Promise.resolve({ id: 'acc-ledger-1' })),
    },
    ledgerTransaction: {
      create: vi.fn(({ data }) => Promise.resolve({ id: `tx_${Date.now()}`, ...data })),
    },
    ledgerPosting: {
      createMany: vi.fn(({ data }) => Promise.resolve({ count: data.length })),
    },
    purchase: {
      findMany: vi.fn(() => Promise.resolve([])),
      create: vi.fn(({ data }) => Promise.resolve({ id: `pur_${Date.now()}`, ...data })),
    },
    $transaction: vi.fn(async (cb: any) => {
      if (typeof cb === 'function') return cb(mockPrisma);
      return Promise.all(cb);
    }),
  };

  const mockRedis: any = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  };

  const mockPayments: any = {
    processDirectCharge: vi.fn().mockResolvedValue({
      paymentId: 'pay-ccbill-123',
      status: 'succeeded',
      providerName: 'ccbill',
    }),
  };

  beforeEach(() => {
    mockWallets.clear();
    mockSubscriptions.clear();
    mockPlans.clear();
    mockCreators.clear();
    mockVerifications.clear();

    const creatorId = 'creator-alice';
    mockCreators.set(creatorId, { id: creatorId, userId: creatorId, handle: 'alice', isApproved: true });
    const planId = 'plan-monthly-alice';
    mockPlans.set(planId, {
      id: planId,
      creatorId,
      periodMonths: 1,
      durationMonths: 1,
      priceCents: 1499, // $14.99
      isDefault: true,
      creator: {
        userId: creatorId,
        user: { handle: 'alice', displayName: 'Alice' },
      },
    });

    ageService = new AgeService(mockPrisma, mockRedis);
    walletService = new WalletService(mockPrisma, mockPayments);
    subscriptionsService = new SubscriptionsService(mockPrisma, walletService);
  });

  it('executes complete Flow B: Regional Age Gate -> Wallet Topup ($50) -> Creator Subscription ($14.99)', async () => {
    const fanId = 'fan-bob';

    // Step 1: Regional age verification check
    const requirement = ageService.getRequiredMethod('US', 'TX');
    expect(requirement.requiredMethod).toBe('id_liveness');

    const session = await ageService.createSession(fanId, 'US', 'TX');
    expect(session.sessionId).toBeDefined();
    expect(session.requiredMethod).toBe('id_liveness');

    await ageService.completeVerification(session.sessionId, true, 25);

    // Step 2: Fan tops up wallet with $50.00
    const topup = await walletService.topup(fanId, {
      amountCents: 5000,
      paymentMethod: 'card',
      currency: 'USD',
    });

    expect(topup.balanceCents).toBe(5000);

    // Step 3: Fan Subscribes to Creator
    const subResult = await subscriptionsService.subscribe(fanId, {
      creatorId: 'creator-alice',
      planId: 'plan-monthly-alice',
      paymentMethod: 'wallet',
      autoRenew: true,
    });

    expect(subResult.status).toBe('active');
    expect(subResult.creatorId).toBe('creator-alice');
  });
});
