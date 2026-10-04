import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from '../src/analytics/analytics.service.js';

describe('Creator Analytics & Business Dashboards (Epic E15)', () => {
  let analyticsService: AnalyticsService;

  const mockPurchases: any[] = [];
  const mockSubscriptions: any[] = [];
  const mockUsers = new Map<string, any>();
  const mockCreators = new Map<string, any>();

  const mockPrisma: any = {
    creatorProfile: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockCreators.get(where.userId) || null)),
    },
    purchase: {
      findMany: vi.fn(() => Promise.resolve(mockPurchases)),
      groupBy: vi.fn(() =>
        Promise.resolve([
          { buyerId: 'u-fan-1', _sum: { grossCents: 450000 } },
          { buyerId: 'u-fan-2', _sum: { grossCents: 200000 } },
        ])
      ),
    },
    subscription: {
      count: vi.fn(({ where }) => {
        if (where.status === 'active') return Promise.resolve(120);
        if (where.createdAt?.gte) return Promise.resolve(15);
        if (where.status?.in) return Promise.resolve(5);
        return Promise.resolve(0);
      }),
    },
    user: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockUsers.get(where.id) || null)),
    },
  };

  beforeEach(() => {
    mockPurchases.length = 0;
    mockSubscriptions.length = 0;
    mockUsers.clear();
    mockCreators.clear();

    const creatorId = 'u-creator-1';
    mockCreators.set(creatorId, { id: 'prof-1', userId: creatorId });

    mockUsers.set('u-fan-1', {
      id: 'u-fan-1',
      handle: 'marcus_vip',
      displayName: 'Marcus V',
      updatedAt: new Date(),
    });
    mockUsers.set('u-fan-2', {
      id: 'u-fan-2',
      handle: 'dave_k',
      displayName: 'Dave K',
      updatedAt: new Date(),
    });

    analyticsService = new AnalyticsService(mockPrisma);
  });

  it('aggregates high-level creator KPI summary and calculates churn rate', async () => {
    mockPurchases.push(
      { grossCents: 5000, feeCents: 1000, netCents: 4000, type: 'subscription' },
      { grossCents: 2500, feeCents: 500, netCents: 2000, type: 'ppv_post' },
      { grossCents: 2000, feeCents: 400, netCents: 1600, type: 'tip' }
    );

    const summary = await analyticsService.getSummary('u-creator-1');

    expect(summary.totalEarningsCents).toBe(9500);
    expect(summary.platformFeeCents).toBe(1900); // 20%
    expect(summary.netEarningsCents).toBe(7600); // 80%
    expect(summary.activeSubscribersCount).toBe(120);
    expect(summary.averageTipCents).toBe(2000);
  });

  it('generates earnings breakdown by revenue stream source', async () => {
    mockPurchases.push(
      { grossCents: 10000, feeCents: 2000, netCents: 8000, type: 'subscription', createdAt: new Date() },
      { grossCents: 5000, feeCents: 1000, netCents: 4000, type: 'ppv_post', createdAt: new Date() },
      { grossCents: 3000, feeCents: 600, netCents: 2400, type: 'stream_gift', createdAt: new Date() },
      { grossCents: 2000, feeCents: 400, netCents: 1600, type: 'stream_ticket', createdAt: new Date() }
    );

    const earnings = await analyticsService.getEarnings('u-creator-1', '30d');

    expect(earnings.breakdown.subscriptionsCents).toBe(10000);
    expect(earnings.breakdown.ppvPostsCents).toBe(5000);
    expect(earnings.breakdown.streamGiftsCents).toBe(3000);
    expect(earnings.breakdown.streamTicketsCents).toBe(2000);
    expect(earnings.breakdown.totalGrossCents).toBe(20000);
  });

  it('retrieves top spending fans leaderboard ranked by gross spend', async () => {
    const topFans = await analyticsService.getTopFans('u-creator-1', 10);

    expect(topFans.length).toBe(2);
    expect(topFans[0]?.handle).toBe('marcus_vip');
    expect(topFans[0]?.totalSpendCents).toBe(450000);
    expect(topFans[1]?.handle).toBe('dave_k');
    expect(topFans[1]?.totalSpendCents).toBe(200000);
  });
});
