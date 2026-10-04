import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PostsService } from '../src/posts/posts.service.js';

describe('PostsService (E6 Profiles, Posts & Feed)', () => {
  let service: PostsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      creatorProfile: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      mediaAsset: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      post: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue({ id: 'post-1' }),
      },
      postMedia: {
        createMany: vi.fn(),
      },
      contentPerformer: {
        create: vi.fn(),
      },
      subscription: {
        findFirst: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      postLike: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn(),
        deleteMany: vi.fn(),
      },
      bookmark: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn(),
        deleteMany: vi.fn(),
      },
      entitlement: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      comment: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
      },
      $transaction: vi.fn(async (callbackOrArray) => {
        if (typeof callbackOrArray === 'function') {
          return callbackOrArray(mockPrisma);
        }
        return Promise.all(callbackOrArray);
      }),
    };

    service = new PostsService(mockPrisma);
  });

  it('creates post and attaches media and 2257 performers', async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({
      id: 'creator-uuid-1',
      userId: 'user-1',
      status: 'approved',
      user: { handle: 'alice', displayName: 'Alice' },
    });

    mockPrisma.mediaAsset.findMany.mockResolvedValue([
      { id: 'media-1', ownerId: 'user-1', status: 'approved' },
    ]);

    mockPrisma.post.create.mockResolvedValue({
      id: 'new-post-1',
      creatorId: 'creator-uuid-1',
      body: 'Hello Lumora subscribers!',
      visibility: 'subscribers',
      priceCents: null,
      status: 'published',
      pinned: false,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date(),
    });

    mockPrisma.post.findUnique.mockResolvedValue({
      id: 'new-post-1',
      creatorId: 'creator-uuid-1',
      body: 'Hello Lumora subscribers!',
      visibility: 'subscribers',
      priceCents: null,
      status: 'published',
      pinned: false,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date(),
      creator: { user: { handle: 'alice', displayName: 'Alice' } },
      postMedia: [{ media: { id: 'media-1', kind: 'image', status: 'approved' } }],
    });

    const result = await service.createPost('user-1', {
      body: 'Hello Lumora subscribers!',
      visibility: 'subscribers',
      mediaIds: ['media-1'],
      performerIds: ['performer-1'],
    });

    expect(result.id).toBe('new-post-1');
    expect(result.isEntitled).toBe(true);
    expect(mockPrisma.postMedia.createMany).toHaveBeenCalled();
    expect(mockPrisma.contentPerformer.create).toHaveBeenCalled();
  });

  it('enforces blurred preview for non-subscribers viewing subscriber-only post', async () => {
    mockPrisma.creatorProfile.findFirst.mockResolvedValue({
      id: 'creator-1',
      userId: 'creator-user-1',
      user: { handle: 'alice', displayName: 'Alice' },
    });

    mockPrisma.post.findMany.mockResolvedValue([
      {
        id: 'post-locked-1',
        creatorId: 'creator-1',
        body: 'Subscriber exclusive content',
        visibility: 'subscribers',
        priceCents: null,
        status: 'published',
        pinned: false,
        likeCount: 10,
        commentCount: 2,
        createdAt: new Date(),
        postMedia: [
          {
            media: {
              id: 'media-secret-1',
              kind: 'image',
              status: 'approved',
              width: 1080,
              height: 1920,
            },
          },
        ],
      },
    ]);

    // Viewer is non-subscriber
    mockPrisma.subscription.findFirst.mockResolvedValue(null);

    const result = await service.getCreatorPosts('alice', 'fan-viewer-1');

    expect(result.items.length).toBe(1);
    const post = result.items[0]!;
    expect(post.isEntitled).toBe(false);
    expect(post.media[0]!.blurredUrl).toContain('media-secret-1.jpg');
    expect(post.media[0]!.playbackUrl).toBeNull();
    expect(post.media[0]!.isEntitled).toBe(false);
  });

  it('unblurs media for active subscribers', async () => {
    mockPrisma.creatorProfile.findFirst.mockResolvedValue({
      id: 'creator-1',
      userId: 'creator-user-1',
      user: { handle: 'alice', displayName: 'Alice' },
    });

    mockPrisma.post.findMany.mockResolvedValue([
      {
        id: 'post-locked-1',
        creatorId: 'creator-1',
        body: 'Subscriber exclusive content',
        visibility: 'subscribers',
        priceCents: null,
        status: 'published',
        pinned: false,
        likeCount: 10,
        commentCount: 2,
        createdAt: new Date(),
        postMedia: [
          {
            media: {
              id: 'media-secret-1',
              kind: 'video',
              status: 'approved',
              width: 1080,
              height: 1920,
            },
          },
        ],
      },
    ]);

    // Viewer is active subscriber
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub-active-1',
      status: 'active',
    });

    const result = await service.getCreatorPosts('alice', 'fan-subscriber-1');

    expect(result.items.length).toBe(1);
    const post = result.items[0]!;
    expect(post.isEntitled).toBe(true);
    expect(post.media[0]!.playbackUrl).toContain('master.m3u8');
    expect(post.media[0]!.isEntitled).toBe(true);
  });

  it('handles post likes and atomically increments counter', async () => {
    mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1' });

    const result = await service.likePost('fan-1', 'post-1');
    expect(result.liked).toBe(true);
    expect(mockPrisma.postLike.upsert).toHaveBeenCalledWith({
      where: { postId_userId: { postId: 'post-1', userId: 'fan-1' } },
      create: { postId: 'post-1', userId: 'fan-1' },
      update: {},
    });
    expect(mockPrisma.post.update).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: { likeCount: { increment: 1 } },
    });
  });

  it('creates comments on posts with enabled comments', async () => {
    mockPrisma.post.findUnique.mockResolvedValue({
      id: 'post-1',
      creator: { commentsEnabled: true },
    });

    mockPrisma.comment.create.mockResolvedValue({
      id: 'comment-1',
      postId: 'post-1',
      userId: 'fan-1',
      body: 'Love this photo!',
      parentId: null,
      createdAt: new Date(),
      user: { handle: 'john', displayName: 'John Doe' },
    });

    const result = await service.createComment('fan-1', 'post-1', {
      body: 'Love this photo!',
    });

    expect(result.id).toBe('comment-1');
    expect(result.body).toBe('Love this photo!');
    expect(mockPrisma.post.update).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: { commentCount: { increment: 1 } },
    });
  });
});
