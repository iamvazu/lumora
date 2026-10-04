import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessagingService } from '../src/messaging/messaging.service.js';

describe('MessagingService (E10 Messaging & Mass Messages)', () => {
  let service: MessagingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      creatorProfile: {
        findUnique: vi.fn(),
      },
      conversation: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      message: {
        findMany: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      entitlement: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      agencyCreator: {
        findFirst: vi.fn(),
      },
      massMessage: {
        count: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cbOrArray) => {
        if (typeof cbOrArray === 'function') return cbOrArray(mockPrisma);
        return Promise.all(cbOrArray);
      }),
    };

    service = new MessagingService(mockPrisma);
  });

  it('should list conversations with unread counters and last message', async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(null);
    mockPrisma.conversation.findMany.mockResolvedValue([
      {
        id: 'conv-1',
        creatorId: 'creator-1',
        fanId: 'fan-1',
        creatorUnread: 0,
        fanUnread: 2,
        lastMessageAt: new Date(),
        creator: {
          userId: 'creator-user-id',
          user: { handle: 'stargirl', displayName: 'Star Girl' },
        },
        fan: { handle: 'fanjohn', displayName: 'John' },
        messages: [
          {
            id: 'msg-1',
            conversationId: 'conv-1',
            senderId: 'creator-user-id',
            sender: { handle: 'stargirl', displayName: 'Star Girl' },
            body: 'Hey John, check out my new set!',
            priceCents: 1500,
            isMass: false,
            createdAt: new Date(),
          },
        ],
      },
    ]);

    const res = await service.getConversations('fan-1');
    expect(res.length).toBe(1);
    expect(res[0].unreadCount).toBe(2);
    expect(res[0].creatorHandle).toBe('stargirl');
    expect(res[0].lastMessage?.body).toBe('Hey John, check out my new set!');
  });

  it('should lock PPV messages and mask previews for unentitled users', async () => {
    mockPrisma.conversation.findUnique.mockResolvedValue({
      id: 'conv-1',
      fanId: 'fan-1',
      creator: { userId: 'creator-user-id' },
    });

    mockPrisma.message.findMany.mockResolvedValue([
      {
        id: 'msg-ppv-1',
        conversationId: 'conv-1',
        senderId: 'creator-user-id',
        sender: { handle: 'stargirl', displayName: 'Star Girl' },
        body: 'Exclusive uncensored video!',
        priceCents: 2000,
        isMass: false,
        createdAt: new Date(),
        media: [
          {
            id: 'mm-1',
            mediaId: 'media-1',
            position: 0,
            media: {
              storageKey: 's3://vault/video.mp4',
              thumbKey: 's3://thumbs/thumb.jpg',
              blurredKey: 's3://blurred/blur.jpg',
              mime: 'video/mp4',
            },
          },
        ],
      },
    ]);

    mockPrisma.entitlement.findMany.mockResolvedValue([]); // Not unlocked

    const messages = await service.getMessages('fan-1', 'conv-1');
    expect(messages[0].isLocked).toBe(true);
    expect(messages[0].body).toBe('🔒 Locked PPV Message');
    expect(messages[0].media[0].url).toBeUndefined();
    expect(messages[0].media[0].thumbnailUrl).toBe('s3://blurred/blur.jpg');
  });

  it('should enforce agency staff authorization when sentByStaffId is present', async () => {
    mockPrisma.conversation.findUnique.mockResolvedValue({
      id: 'conv-1',
      creatorId: 'creator-1',
      fanId: 'fan-1',
      creator: { userId: 'creator-user-id' },
      fan: { handle: 'fan-user' },
    });

    // Staff not authorized on agency
    mockPrisma.agencyCreator.findFirst.mockResolvedValue(null);

    await expect(
      service.sendMessage('creator-user-id', 'conv-1', {
        body: 'Hello from staff',
        sentByStaffId: 'bad-staff-id-uuid-1',
        mediaIds: [],
      }),
    ).rejects.toThrow();
  });

  it('should reject mass message creation if creator exceeds 5/hour rate limit', async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({ id: 'creator-1' });
    mockPrisma.massMessage.count.mockResolvedValue(5); // Already sent 5 in past hour

    await expect(
      service.createMassMessage('creator-user-id', {
        body: 'Mass alert!',
        mediaIds: [],
        audienceFilter: { segment: 'all_subscribers' },
      }),
    ).rejects.toThrow();
  });
});
