import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreatePostRequest,
  CreateCommentRequest,
  PostDto,
  CommentDto,
  ProblemException,
} from '@lumora/contracts';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new post (Story E6-1)
   */
  async createPost(userId: string, dto: CreatePostRequest): Promise<PostDto> {
    const creator = await this.prisma.creatorProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!creator) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        status: 403,
        code: 'FORBIDDEN',
        title: 'Not a Creator',
        detail: 'Only registered creators can publish posts.',
        requestId: '',
      });
    }

    if (creator.status === 'suspended' || creator.status === 'rejected') {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        status: 403,
        code: 'FORBIDDEN',
        title: 'Creator Account Suspended',
        detail: 'Your creator account is not eligible to create posts.',
        requestId: '',
      });
    }

    // Verify media assets ownership and status
    if (dto.mediaIds.length > 0) {
      const mediaList = await this.prisma.mediaAsset.findMany({
        where: {
          id: { in: dto.mediaIds },
          ownerId: userId,
        },
      });

      if (mediaList.length !== dto.mediaIds.length) {
        throw new ProblemException({
          type: 'https://lumora.app/errors/validation-error',
          status: 400,
          code: 'VALIDATION_ERROR',
          title: 'Invalid Media Assets',
          detail: 'One or more media assets were not found or do not belong to you.',
          requestId: '',
        });
      }

      for (const m of mediaList) {
        if (m.status === 'rejected') {
          throw new ProblemException({
            type: 'https://lumora.app/errors/validation-error',
            status: 400,
            code: 'CONTENT_MODERATION_FAILED',
            title: 'Media Rejected by Moderation',
            detail: `Media ${m.id} was rejected by moderation compliance.`,
            requestId: '',
          });
        }
      }
    }

    const post = await this.prisma.$transaction(async (tx) => {
      const createdPost = await tx.post.create({
        data: {
          creatorId: creator.id,
          body: dto.body,
          visibility: dto.visibility as any,
          priceCents: dto.visibility === 'ppv' ? dto.priceCents : null,
          tierId: dto.tierId,
          status: dto.publishAt && new Date(dto.publishAt) > new Date() ? 'scheduled' : 'published',
          publishAt: dto.publishAt ? new Date(dto.publishAt) : new Date(),
        },
      });

      // Attach media
      if (dto.mediaIds.length > 0) {
        await tx.postMedia.createMany({
          data: dto.mediaIds.map((mediaId, index) => ({
            postId: createdPost.id,
            mediaId,
            position: index,
            isPreview: false,
          })),
        });
      }

      // Attach performers (2257 compliance)
      if (dto.performerIds.length > 0) {
        for (const mediaId of dto.mediaIds) {
          for (const performerId of dto.performerIds) {
            await tx.contentPerformer.create({
              data: {
                postId: createdPost.id,
                mediaId,
                performerId,
              },
            });
          }
        }
      }

      return createdPost;
    });

    return this.mapToPostDto(post.id);
  }

  /**
   * Get posts for a specific creator profile (Story E6-1, E6-2)
   */
  async getCreatorPosts(handle: string, viewerUserId?: string, limit = 20, _cursor?: string) {
    const creator = await this.prisma.creatorProfile.findFirst({
      where: { user: { handle } },
      include: { user: true },
    });

    if (!creator) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Creator Not Found',
        detail: `Creator @${handle} not found.`,
        requestId: '',
      });
    }

    const posts = await this.prisma.post.findMany({
      where: {
        creatorId: creator.id,
        status: 'published',
      },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: {
        postMedia: {
          include: { media: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    // Check user subscription & entitlements
    let isSubscribed = false;
    const isOwner = viewerUserId === creator.userId;

    if (viewerUserId && !isOwner) {
      const activeSub = await this.prisma.subscription.findFirst({
        where: {
          fanId: viewerUserId,
          creatorId: creator.id,
          status: 'active',
        },
      });
      isSubscribed = !!activeSub;
    }

    const postIds = posts.map((p) => p.id);

    let likedPostIds = new Set<string>();
    let bookmarkedPostIds = new Set<string>();
    let entitledPostIds = new Set<string>();

    if (viewerUserId) {
      const [likes, bookmarks, entitlements] = await Promise.all([
        this.prisma.postLike.findMany({
          where: { userId: viewerUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
        this.prisma.bookmark.findMany({
          where: { userId: viewerUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
        this.prisma.entitlement.findMany({
          where: {
            userId: viewerUserId,
            resourceType: 'post',
            resourceId: { in: postIds },
          },
          select: { resourceId: true },
        }),
      ]);

      likedPostIds = new Set(likes.map((l) => l.postId));
      bookmarkedPostIds = new Set(bookmarks.map((b) => b.postId));
      entitledPostIds = new Set(entitlements.map((e) => e.resourceId));
    }

    const items: PostDto[] = posts.map((p) => {
      const isEntitled =
        isOwner ||
        p.visibility === 'public' ||
        (p.visibility === 'subscribers' && isSubscribed) ||
        entitledPostIds.has(p.id);

      return {
        id: p.id,
        creatorId: creator.id,
        creatorHandle: creator.user.handle,
        creatorDisplayName: creator.user.displayName,
        creatorAvatarUrl: null,
        body: p.body,
        visibility: p.visibility as any,
        priceCents: p.priceCents,
        status: p.status as any,
        publishAt: p.publishAt?.toISOString() || null,
        pinned: p.pinned,
        likeCount: p.likeCount,
        commentCount: p.commentCount,
        isLiked: likedPostIds.has(p.id),
        isBookmarked: bookmarkedPostIds.has(p.id),
        isEntitled,
        media: p.postMedia.map((pm) => ({
          id: pm.media.id,
          kind: pm.media.kind as any,
          status: pm.media.status as any,
          width: pm.media.width,
          height: pm.media.height,
          durationMs: pm.media.durationMs,
          thumbUrl: isEntitled ? `https://media.lumora.app/thumb/${pm.media.id}.jpg` : null,
          blurredUrl: `https://media.lumora.app/blurred/${pm.media.id}.jpg`,
          playbackUrl: isEntitled ? `https://media.lumora.app/stream/${pm.media.id}/master.m3u8` : null,
          isEntitled,
        })),
        createdAt: p.createdAt.toISOString(),
      };
    });

    return {
      items,
      count: items.length,
    };
  }

  /**
   * Get personalized home feed for user (Story E6-2)
   */
  async getFeed(viewerUserId: string, filter: 'all' | 'subscribed' | 'bookmarks' = 'all', limit = 20) {
    let where: any = { status: 'published' };

    if (filter === 'bookmarks') {
      const bookmarks = await this.prisma.bookmark.findMany({
        where: { userId: viewerUserId },
        select: { postId: true },
      });
      where.id = { in: bookmarks.map((b) => b.postId) };
    } else if (filter === 'subscribed') {
      const subs = await this.prisma.subscription.findMany({
        where: { fanId: viewerUserId, status: 'active' },
        select: { creatorId: true },
      });
      where.creatorId = { in: subs.map((s) => s.creatorId) };
    }

    const posts = await this.prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        creator: { include: { user: true } },
        postMedia: {
          include: { media: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    const postIds = posts.map((p) => p.id);
    const creatorIds = Array.from(new Set(posts.map((p) => p.creatorId)));

    const [likes, bookmarks, subs, entitlements] = await Promise.all([
      this.prisma.postLike.findMany({
        where: { userId: viewerUserId, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.prisma.bookmark.findMany({
        where: { userId: viewerUserId, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.prisma.subscription.findMany({
        where: {
          fanId: viewerUserId,
          creatorId: { in: creatorIds },
          status: 'active',
        },
        select: { creatorId: true },
      }),
      this.prisma.entitlement.findMany({
        where: {
          userId: viewerUserId,
          resourceType: 'post',
          resourceId: { in: postIds },
        },
        select: { resourceId: true },
      }),
    ]);

    const likedPostIds = new Set(likes.map((l) => l.postId));
    const bookmarkedPostIds = new Set(bookmarks.map((b) => b.postId));
    const activeSubCreatorIds = new Set(subs.map((s) => s.creatorId));
    const entitledPostIds = new Set(entitlements.map((e) => e.resourceId));

    const items: PostDto[] = posts.map((p) => {
      const isOwner = p.creator.userId === viewerUserId;
      const isSubscribed = activeSubCreatorIds.has(p.creatorId);
      const isEntitled =
        isOwner ||
        p.visibility === 'public' ||
        (p.visibility === 'subscribers' && isSubscribed) ||
        entitledPostIds.has(p.id);

      return {
        id: p.id,
        creatorId: p.creatorId,
        creatorHandle: p.creator.user.handle,
        creatorDisplayName: p.creator.user.displayName,
        creatorAvatarUrl: null,
        body: p.body,
        visibility: p.visibility as any,
        priceCents: p.priceCents,
        status: p.status as any,
        publishAt: p.publishAt?.toISOString() || null,
        pinned: p.pinned,
        likeCount: p.likeCount,
        commentCount: p.commentCount,
        isLiked: likedPostIds.has(p.id),
        isBookmarked: bookmarkedPostIds.has(p.id),
        isEntitled,
        media: p.postMedia.map((pm) => ({
          id: pm.media.id,
          kind: pm.media.kind as any,
          status: pm.media.status as any,
          width: pm.media.width,
          height: pm.media.height,
          durationMs: pm.media.durationMs,
          thumbUrl: isEntitled ? `https://media.lumora.app/thumb/${pm.media.id}.jpg` : null,
          blurredUrl: `https://media.lumora.app/blurred/${pm.media.id}.jpg`,
          playbackUrl: isEntitled ? `https://media.lumora.app/stream/${pm.media.id}/master.m3u8` : null,
          isEntitled,
        })),
        createdAt: p.createdAt.toISOString(),
      };
    });

    return {
      items,
      count: items.length,
    };
  }

  /**
   * Like a post (Story E6-3)
   */
  async likePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Post Not Found',
        detail: `Post ${postId} does not exist.`,
        requestId: '',
      });
    }

    await this.prisma.$transaction([
      this.prisma.postLike.upsert({
        where: { postId_userId: { postId, userId } },
        create: { postId, userId },
        update: {},
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    return { liked: true };
  }

  /**
   * Unlike a post
   */
  async unlikePost(userId: string, postId: string) {
    await this.prisma.$transaction([
      this.prisma.postLike.deleteMany({
        where: { postId, userId },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);

    return { liked: false };
  }

  /**
   * Bookmark a post
   */
  async bookmarkPost(userId: string, postId: string) {
    await this.prisma.bookmark.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId },
      update: {},
    });
    return { bookmarked: true };
  }

  /**
   * Remove bookmark
   */
  async unbookmarkPost(userId: string, postId: string) {
    await this.prisma.bookmark.deleteMany({
      where: { userId, postId },
    });
    return { bookmarked: false };
  }

  /**
   * Comments on post
   */
  async getComments(postId: string, limit = 50): Promise<CommentDto[]> {
    const comments = await this.prisma.comment.findMany({
      where: { postId, status: 'published' },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: { user: true },
    });

    return comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      userId: c.userId,
      userHandle: c.user.handle,
      userDisplayName: c.user.displayName,
      userAvatarUrl: null,
      body: c.body,
      parentId: c.parentId,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async createComment(userId: string, postId: string, dto: CreateCommentRequest): Promise<CommentDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { creator: true },
    });

    if (!post) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/not-found',
        status: 404,
        code: 'NOT_FOUND',
        title: 'Post Not Found',
        detail: `Post ${postId} does not exist.`,
        requestId: '',
      });
    }

    if (!post.creator.commentsEnabled) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/forbidden',
        status: 403,
        code: 'FORBIDDEN',
        title: 'Comments Disabled',
        detail: 'Comments are disabled for this creator.',
        requestId: '',
      });
    }

    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: {
          postId,
          userId,
          body: dto.body,
          parentId: dto.parentId,
        },
        include: { user: true },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    return {
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      userHandle: comment.user.handle,
      userDisplayName: comment.user.displayName,
      userAvatarUrl: null,
      body: comment.body,
      parentId: comment.parentId,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  private async mapToPostDto(postId: string): Promise<PostDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        creator: { include: { user: true } },
        postMedia: {
          include: { media: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!post) {
      throw new Error(`Post ${postId} not found.`);
    }

    return {
      id: post.id,
      creatorId: post.creatorId,
      creatorHandle: post.creator.user.handle,
      creatorDisplayName: post.creator.user.displayName,
      creatorAvatarUrl: null,
      body: post.body,
      visibility: post.visibility as any,
      priceCents: post.priceCents,
      status: post.status as any,
      publishAt: post.publishAt?.toISOString() || null,
      pinned: post.pinned,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      isLiked: false,
      isBookmarked: false,
      isEntitled: true,
      media: post.postMedia.map((pm) => ({
        id: pm.media.id,
        kind: pm.media.kind as any,
        status: pm.media.status as any,
        width: pm.media.width,
        height: pm.media.height,
        durationMs: pm.media.durationMs,
        thumbUrl: `https://media.lumora.app/thumb/${pm.media.id}.jpg`,
        blurredUrl: `https://media.lumora.app/blurred/${pm.media.id}.jpg`,
        playbackUrl: `https://media.lumora.app/stream/${pm.media.id}/master.m3u8`,
        isEntitled: true,
      })),
      createdAt: post.createdAt.toISOString(),
    };
  }
}
