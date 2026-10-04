import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReferralsService } from '../src/referrals/referrals.service.js';

describe('Creator Referral Program (Epic E17)', () => {
  let referralsService: ReferralsService;

  const mockUsers = new Map<string, any>();
  const mockCreators = new Map<string, any>();
  const mockReferrals = new Map<string, any>();
  const mockPurchases = new Map<string, any>();

  const mockPrisma: any = {
    creatorProfile: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockCreators.get(where.userId || where.id) || null)),
    },
    user: {
      findUnique: vi.fn(({ where }) => {
        if (where.id) return Promise.resolve(mockUsers.get(where.id) || null);
        if (where.handle) {
          for (const u of mockUsers.values()) {
            if (u.handle.toLowerCase() === where.handle.toLowerCase()) return Promise.resolve(u);
          }
        }
        return Promise.resolve(null);
      }),
    },
    referral: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockReferrals.get(where.referredCreatorId) || null)),
      findMany: vi.fn(({ where }) => {
        const list = Array.from(mockReferrals.values()).filter((r) => r.referrerCreatorId === where.referrerCreatorId);
        return Promise.resolve(list);
      }),
      create: vi.fn(({ data }) => {
        const referred = mockUsers.get(data.referredCreatorId);
        const ref = {
          id: data.id || `ref_${Date.now()}`,
          ...data,
          referred,
          createdAt: new Date(),
        };
        mockReferrals.set(ref.referredCreatorId, ref);
        return Promise.resolve(ref);
      }),
    },
    purchase: {
      aggregate: vi.fn(({ where }) => {
        let totalFee = 0;
        for (const p of mockPurchases.values()) {
          if (p.sellerId === where.sellerId && p.status === where.status) {
            totalFee += p.feeCents || 0;
          }
        }
        return Promise.resolve({ _sum: { feeCents: totalFee } });
      }),
    },
  };

  const mockConfig: any = {
    get: vi.fn((key: string) => {
      if (key === 'APP_URL') return 'https://lumora.app';
      return null;
    }),
  };

  beforeEach(() => {
    mockUsers.clear();
    mockCreators.clear();
    mockReferrals.clear();
    mockPurchases.clear();

    // Setup creator 1 (referrer)
    const user1 = { id: 'u-ref-1', handle: 'elena', displayName: 'Elena V.' };
    mockUsers.set(user1.id, user1);
    mockCreators.set(user1.id, { id: 'c-ref-1', userId: user1.id, user: user1, status: 'approved' });

    // Setup creator 2 (referred)
    const user2 = { id: 'u-ref-2', handle: 'marcus', displayName: 'Marcus S.' };
    mockUsers.set(user2.id, user2);
    mockCreators.set(user2.id, { id: 'c-ref-2', userId: user2.id, user: user2, status: 'approved' });

    referralsService = new ReferralsService(mockPrisma, mockConfig);
  });

  it('attaches a referral link for 12 months duration', async () => {
    const ref = await referralsService.attachReferral('elena', 'u-ref-2');
    expect(ref).toBeDefined();
    expect(ref?.referrerCreatorId).toBe('u-ref-1');
    expect(ref?.referredCreatorId).toBe('u-ref-2');
    expect(ref?.shareBps).toBe(500); // 5%
    expect(ref?.isActive).toBe(true);

    const expires = new Date(ref!.expiresAt);
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    expect(expires.getFullYear()).toBe(oneYearLater.getFullYear());
  });

  it('computes referral summary and 5% platform fee commission earnings', async () => {
    await referralsService.attachReferral('elena', 'u-ref-2');

    // Simulate referred creator sales: $100 GMV -> $20 platform fee (2000 cents)
    mockPurchases.set('p1', {
      id: 'p1',
      sellerId: 'u-ref-2',
      status: 'succeeded',
      grossCents: 10000,
      feeCents: 2000,
      netCents: 8000,
    });

    const summary = await referralsService.getSummary('u-ref-1');
    expect(summary.referralCode).toBe('elena');
    expect(summary.referralUrl).toBe('https://lumora.app/signup?ref=elena');
    expect(summary.activeReferralsCount).toBe(1);
    // 500 bps (25% of 2000 fee cents) = 500 cents ($5.00)
    expect(summary.totalCommissionCents).toBe(500);
    expect(summary.referrals[0].totalEarnedCents).toBe(500);
  });
});
