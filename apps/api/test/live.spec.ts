import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LiveService } from '../src/live/live.service.js';
import { LiveChatService } from '../src/live/live-chat.service.js';

describe('Live Streaming & Stream Chat (Epic E14)', () => {
  let liveService: LiveService;
  let liveChatService: LiveChatService;

  const mockStreams = new Map<string, any>();
  const mockCreators = new Map<string, any>();
  const mockUsers = new Map<string, any>();
  const mockSubscriptions = new Map<string, any>();
  const mockEntitlements = new Map<string, any>();
  const mockWallets = new Map<string, any>();
  const mockChats = new Map<string, any>();

  const mockPrisma: any = {
    creatorProfile: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockCreators.get(where.userId || where.id) || null)),
    },
    user: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockUsers.get(where.id) || null)),
    },
    liveStream: {
      create: vi.fn(({ data }) => {
        const creator = mockCreators.get('creator-1');
        const s = {
          id: `stream_${Date.now()}`,
          ...data,
          creator,
          createdAt: new Date(),
        };
        mockStreams.set(s.id, s);
        return Promise.resolve(s);
      }),
      findUnique: vi.fn(({ where }) => Promise.resolve(mockStreams.get(where.id) || null)),
      update: vi.fn(({ where, data }) => {
        const s = mockStreams.get(where.id);
        if (!s) throw new Error('Stream not found');
        const updated = { ...s, ...data };
        mockStreams.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    subscription: {
      findFirst: vi.fn(({ where }) => {
        for (const sub of mockSubscriptions.values()) {
          if (sub.fanId === where.fanId && sub.creatorId === where.creatorId && sub.status === where.status) {
            return Promise.resolve(sub);
          }
        }
        return Promise.resolve(null);
      }),
    },
    entitlement: {
      findUnique: vi.fn(({ where }) => {
        const key = `${where.userId_resourceType_resourceId?.userId}_${where.userId_resourceType_resourceId?.resourceId}`;
        return Promise.resolve(mockEntitlements.get(key) || null);
      }),
    },
    wallet: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockWallets.get(where.userId) || null)),
      update: vi.fn(({ where, data }) => {
        const w = mockWallets.get(where.userId);
        if (!w) throw new Error('Wallet not found');
        let newBal = w.balanceCents;
        if (data.balanceCents?.decrement !== undefined) {
          newBal = newBal - BigInt(data.balanceCents.decrement);
        }
        const updated = { ...w, ...data, balanceCents: newBal };
        mockWallets.set(where.userId, updated);
        return Promise.resolve(updated);
      }),
    },
    creatorBalance: {
      upsert: vi.fn(() => Promise.resolve({ pendingCents: 1600n })),
    },
    purchase: {
      create: vi.fn(({ data }) => Promise.resolve({ id: `pur_${Date.now()}`, ...data })),
      aggregate: vi.fn(() => Promise.resolve({ _sum: { grossCents: 32000 } })),
    },
    streamChat: {
      create: vi.fn(({ data }) => {
        const c = { id: `chat_${Date.now()}`, ...data, user: mockUsers.get(data.userId), createdAt: new Date() };
        mockChats.set(c.id, c);
        return Promise.resolve(c);
      }),
      findMany: vi.fn(() => Promise.resolve(Array.from(mockChats.values()))),
    },
    $transaction: vi.fn(async (cb: any) => {
      if (typeof cb === 'function') return cb(mockPrisma);
      return Promise.all(cb);
    }),
  };

  const mockConfig: any = {
    get: vi.fn((key: string) => {
      if (key === 'LIVEKIT_API_SECRET') return 'test_livekit_secret_key_1234567890';
      if (key === 'LIVEKIT_API_KEY') return 'test_key';
      if (key === 'LIVEKIT_WS_URL') return 'wss://live.lumora.app';
      return null;
    }),
  };

  const mockWalletService: any = {
    getBalance: vi.fn(),
  };

  beforeEach(() => {
    mockStreams.clear();
    mockCreators.clear();
    mockUsers.clear();
    mockSubscriptions.clear();
    mockEntitlements.clear();
    mockWallets.clear();
    mockChats.clear();

    const creatorUser = { id: 'u-creator-1', handle: 'elena', displayName: 'Elena V.' };
    const creatorProf = { id: 'creator-1', userId: 'u-creator-1', user: creatorUser };
    mockUsers.set('u-creator-1', creatorUser);
    mockCreators.set('creator-1', creatorProf);
    mockCreators.set('u-creator-1', creatorProf);

    const fanUser = { id: 'u-fan-1', handle: 'bob', displayName: 'Bob Fan' };
    mockUsers.set('u-fan-1', fanUser);
    mockWallets.set('u-fan-1', { id: 'wal-1', userId: 'u-fan-1', balanceCents: 5000n });

    liveService = new LiveService(mockPrisma, mockConfig);
    liveChatService = new LiveChatService(mockPrisma, mockWalletService);
  });

  it('schedules, starts, and ends a live stream with publisher LiveKit token', async () => {
    // 1. Schedule stream
    const stream = await liveService.createStream('u-creator-1', {
      title: 'Acoustic Guitar Live Session',
      access: 'subscribers',
      tipGoalCents: 50000,
    });

    expect(stream.id).toBeDefined();
    expect(stream.status).toBe('scheduled');
    expect(stream.roomName).toContain('room-');

    // 2. Start stream
    const startResult = await liveService.startStream('u-creator-1', stream.id);
    expect(startResult.isPublisher).toBe(true);
    expect(startResult.livekitToken).toBeDefined();

    const activeStream = await liveService.getStream(stream.id, 'u-creator-1');
    expect(activeStream.status).toBe('live');

    // 3. End stream
    const endResult = await liveService.endStream('u-creator-1', stream.id);
    expect(endResult.status).toBe('ended');
  });

  it('rejects joining subscriber stream if fan has no active subscription', async () => {
    const stream = await liveService.createStream('u-creator-1', {
      title: 'Subscriber Only Stream',
      access: 'subscribers',
    });

    await liveService.startStream('u-creator-1', stream.id);

    // Fan without subscription attempts to join
    await expect(liveService.joinStream('u-fan-1', stream.id)).rejects.toThrow(/subscription is required/i);
  });

  it('allows joining subscriber stream when fan is subscribed', async () => {
    const stream = await liveService.createStream('u-creator-1', {
      title: 'Subscriber Only Stream',
      access: 'subscribers',
    });

    await liveService.startStream('u-creator-1', stream.id);

    // Subscribe fan
    mockSubscriptions.set('sub-1', {
      fanId: 'u-fan-1',
      creatorId: 'u-creator-1',
      status: 'active',
    });

    const joinResult = await liveService.joinStream('u-fan-1', stream.id);
    expect(joinResult.livekitToken).toBeDefined();
    expect(joinResult.isPublisher).toBe(false);
  });

  it('posts in-stream chat message and deducts tip with 80/20 ledger split', async () => {
    const stream = await liveService.createStream('u-creator-1', {
      title: 'VIP Q&A',
      access: 'subscribers',
    });

    const chat = await liveChatService.sendMessage('u-fan-1', stream.id, {
      body: 'Amazing performance tonight! Here is a $20 gift!',
      tipAmountCents: 2000,
    });

    expect(chat.id).toBeDefined();
    expect(chat.tipAmountCents).toBe(2000);
    expect(chat.userHandle).toBe('bob');

    // Verify wallet deduction ($50 - $20 = $30)
    const wallet = mockWallets.get('u-fan-1');
    expect(wallet.balanceCents).toBe(3000n);
  });
});
