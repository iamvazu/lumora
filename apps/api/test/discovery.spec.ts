import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiscoveryService } from '../src/discovery/discovery.service.js';

describe('Discovery & Safe Search (Epic E16)', () => {
  let discoveryService: DiscoveryService;

  const mockCreators = [
    {
      id: 'c1',
      userId: 'u1',
      bio: 'Cosplay artist and digital creator',
      category: ['cosplay', 'art'],
      isPaid: true,
      subscriptionPriceCents: 999,
      currency: 'USD',
      commentsEnabled: true,
      status: 'approved',
      subscriberCount: 500,
      bannerMediaId: null,
      user: {
        id: 'u1',
        handle: 'cosplay_queen',
        displayName: 'Elena Vance',
        avatarMediaId: null,
      },
      _count: {
        posts: 42,
        followers: 1200,
      },
    },
    {
      id: 'c2',
      userId: 'u2',
      bio: 'Daily fitness workouts and nutrition guides',
      category: ['fitness', 'lifestyle'],
      isPaid: true,
      subscriptionPriceCents: 1499,
      currency: 'USD',
      commentsEnabled: true,
      status: 'approved',
      subscriberCount: 850,
      bannerMediaId: null,
      user: {
        id: 'u2',
        handle: 'fit_marcus',
        displayName: 'Marcus Strong',
        avatarMediaId: null,
      },
      _count: {
        posts: 120,
        followers: 3400,
      },
    },
  ];

  const mockPrisma: any = {
    creatorProfile: {
      count: vi.fn(({ where }) => {
        let list = mockCreators.filter((c) => c.status === where.status);
        if (where.category?.has) {
          list = list.filter((c) => c.category.includes(where.category.has));
        }
        return Promise.resolve(list.length);
      }),
      findMany: vi.fn(({ where, skip = 0, take = 20 }) => {
        let list = mockCreators.filter((c) => c.status === where.status);
        if (where.category?.has) {
          list = list.filter((c) => c.category.includes(where.category.has));
        }
        if (where.OR) {
          const term = where.OR[0].user.handle.contains.toLowerCase();
          list = list.filter(
            (c) =>
              c.user.handle.toLowerCase().includes(term) ||
              c.user.displayName.toLowerCase().includes(term) ||
              c.bio.toLowerCase().includes(term) ||
              c.category.some((cat) => cat.includes(term))
          );
        }
        return Promise.resolve(list.slice(skip, skip + take));
      }),
    },
  };

  beforeEach(() => {
    discoveryService = new DiscoveryService(mockPrisma);
  });

  it('searches creators by query string keyword', async () => {
    const res = await discoveryService.search({ q: 'cosplay', page: 1, limit: 20 });
    expect(res.creators).toHaveLength(1);
    expect(res.creators[0].handle).toBe('cosplay_queen');
    expect(res.total).toBe(2); // total approved in mock count
  });

  it('filters creators by category taxonomy', async () => {
    const res = await discoveryService.search({ category: 'fitness', page: 1, limit: 20 });
    expect(res.creators).toHaveLength(1);
    expect(res.creators[0].handle).toBe('fit_marcus');
  });

  it('retrieves curated discovery categories with creator counts', async () => {
    const categories = await discoveryService.getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(5);
    const cosplayCat = categories.find((c) => c.slug === 'cosplay');
    expect(cosplayCat).toBeDefined();
    expect(cosplayCat?.creatorCount).toBe(1);
  });

  it('retrieves featured and trending discovery carousels', async () => {
    const featured = await discoveryService.getFeatured();
    expect(featured.featured.length).toBeGreaterThan(0);
    expect(featured.trending.length).toBeGreaterThan(0);
    expect(featured.categories.length).toBeGreaterThan(0);
  });
});
