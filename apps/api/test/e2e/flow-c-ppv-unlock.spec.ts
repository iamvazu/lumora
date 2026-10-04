import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PurchasesService } from '../../src/purchases/purchases.service.js';
import { PostsService } from '../../src/posts/posts.service.js';
import { WalletService } from '../../src/wallet/wallet.service.js';

describe('E2E Flow C: PPV Content Purchase, Double-Entry Settlement & Media Unlock', () => {
  let postsService: PostsService;
  let purchasesService: PurchasesService;
  let walletService: WalletService;

  const mockWallets = new Map<string, any>();
  const mockPurchases = new Map<string, any>();
  const mockPosts = new Map<string, any>();
  const mockMedia = new Map<string, any>();
  const mockEntitlements = new Map<string, any>();

  const mockPrisma: any = {
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
    creatorProfile: {
      findUnique: vi.fn(({ where }) => Promise.resolve({
        id: 'creator-prof-1',
        userId: where.userId || 'creator-charlie',
        user: { handle: 'charlie', displayName: 'Charlie' },
      })),
      findFirst: vi.fn(() => Promise.resolve({
        id: 'creator-prof-1',
        userId: 'creator-charlie',
        user: { handle: 'charlie', displayName: 'Charlie' },
      })),
    },
    post: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockPosts.get(where.id) || null)),
      create: vi.fn(({ data }) => {
        const p = {
          id: `post_${Date.now()}`,
          ...data,
          creator: {
            id: 'creator-prof-1',
            userId: 'creator-charlie',
            user: { handle: 'charlie', displayName: 'Charlie' },
          },
          media: [],
          postMedia: [],
          createdAt: new Date(),
        };
        mockPosts.set(p.id, p);
        return Promise.resolve(p);
      }),
    },
    mediaAsset: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockMedia.get(where.id) || null)),
      findMany: vi.fn(() => Promise.resolve(Array.from(mockMedia.values()))),
    },
    postMedia: {
      createMany: vi.fn(() => Promise.resolve({ count: 1 })),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    entitlement: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockEntitlements.get(`${where.userId_resourceType_resourceId?.userId}_${where.userId_resourceType_resourceId?.resourceId}`) || null)),
      findMany: vi.fn(() => Promise.resolve([])),
      upsert: vi.fn(({ create }) => {
        const key = `${create.userId}_${create.resourceId}`;
        mockEntitlements.set(key, create);
        return Promise.resolve(create);
      }),
    },
    purchase: {
      findFirst: vi.fn(() => Promise.resolve(null)),
      findMany: vi.fn(() => Promise.resolve([])),
      create: vi.fn(({ data }) => {
        const p = { id: `pur_${Date.now()}`, ...data, createdAt: new Date() };
        mockPurchases.set(p.id, p);
        return Promise.resolve(p);
      }),
    },
    subscription: {
      findFirst: vi.fn(() => Promise.resolve(null)),
      findMany: vi.fn(() => Promise.resolve([])),
    },
    creatorBalance: {
      upsert: vi.fn(({ where, update, create }) => Promise.resolve({ creatorId: where.creatorId, pendingCents: 1600n, availableCents: 0n })),
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
    postLike: {
      findMany: vi.fn(() => Promise.resolve([])),
    },
    bookmark: {
      findMany: vi.fn(() => Promise.resolve([])),
    },
    comment: {
      findMany: vi.fn(() => Promise.resolve([])),
    },
    $transaction: vi.fn(async (cb: any) => {
      if (typeof cb === 'function') return cb(mockPrisma);
      return Promise.all(cb);
    }),
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
    mockPurchases.clear();
    mockPosts.clear();
    mockMedia.clear();
    mockEntitlements.clear();

    walletService = new WalletService(mockPrisma, mockPayments);
    purchasesService = new PurchasesService(mockPrisma, mockPayments);
    postsService = new PostsService(mockPrisma);
  });

  it('executes complete Flow C: Creator PPV Post -> Wallet Topup -> Instant PPV Unlock -> Entitlement Provisioned', async () => {
    const creatorId = 'creator-charlie';
    const fanId = 'fan-david';

    // Step 1: Fund fan wallet with $30.00
    const topup = await walletService.topup(fanId, {
      amountCents: 3000,
      paymentMethod: 'card',
      currency: 'USD',
    });
    expect(topup.balanceCents).toBe(3000);

    // Step 2: Creator publishes PPV post ($20.00)
    const mediaId = 'media-exclusive-1';
    mockMedia.set(mediaId, {
      id: mediaId,
      ownerId: creatorId,
      storageKey: 'media/exclusive-full.mp4',
      thumbKey: 'media/thumb-clean.jpg',
      blurredKey: 'media/thumb-blurred.jpg',
      mime: 'video/mp4',
    });

    const post = await postsService.createPost(creatorId, {
      caption: 'Exclusive backstage full video release 🎬',
      visibility: 'ppv',
      priceCents: 2000,
      mediaIds: [mediaId],
      performerIds: [],
    });

    // Populate post with creator and pricing for purchase check
    mockPosts.set(post.id, {
      ...post,
      isPpv: true,
      priceCents: 2000,
      currency: 'USD',
      creator: { userId: creatorId },
    });

    // Step 3: Fan executes PPV unlock using wallet balance
    const purchase = await purchasesService.purchase(fanId, {
      type: 'ppv_post',
      resourceId: post.id,
      paymentSource: 'wallet',
    });

    expect(purchase.status).toBe('succeeded');
    expect(purchase.grossCents).toBe(2000);
    expect(purchase.feeCents).toBe(400); // 20% platform fee
    expect(purchase.netCents).toBe(1600); // 80% creator net

    // Step 4: Verify entitlement registered
    expect(mockPrisma.entitlement.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: fanId,
          resourceType: 'post',
          resourceId: post.id,
        }),
      }),
    );
  });
});
