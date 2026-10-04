import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  SearchQuery,
  DiscoverySearchResponse,
  FeaturedCreatorsResponse,
  CategoryDto,
  CreatorProfileDto,
} from '@lumora/contracts';

@Injectable()
export class DiscoveryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Search creators by handle, display name, bio, or category (Story E16-1)
   */
  async search(query: SearchQuery): Promise<DiscoverySearchResponse> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 50);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      status: 'approved',
    };

    if (query.q && query.q.trim()) {
      const term = query.q.trim();
      whereClause.OR = [
        { user: { handle: { contains: term, mode: 'insensitive' } } },
        { user: { displayName: { contains: term, mode: 'insensitive' } } },
        { bio: { contains: term, mode: 'insensitive' } },
        { category: { has: term.toLowerCase() } },
      ];
    }

    if (query.category && query.category.trim()) {
      whereClause.category = { has: query.category.trim().toLowerCase() };
    }

    const [total, creators] = await Promise.all([
      this.prisma.creatorProfile.count({ where: whereClause }),
      this.prisma.creatorProfile.findMany({
        where: whereClause,
        include: {
          user: true,
          _count: {
            select: {
              posts: true,
              followers: true,
              subscriptions: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const mappedCreators: CreatorProfileDto[] = creators.map((c: any) => ({
      id: c.id,
      userId: c.userId,
      handle: c.user?.handle || '',
      displayName: c.user?.displayName || '',
      avatarMediaId: c.user?.avatarMediaId || null,
      bannerMediaId: c.bannerMediaId || null,
      avatarUrl: null,
      bannerUrl: null,
      bio: c.bio || null,
      category: c.category || [],
      isPaid: c.isPaid,
      subscriptionPriceCents: c.subscriptionPriceCents,
      currency: c.currency,
      commentsEnabled: c.commentsEnabled,
      status: c.status as any,
      followerCount: c._count?.followers || 0,
      subscriberCount: c._count?.subscriptions || 0,
      postCount: c._count?.posts || 0,
      mediaCount: 0,
    }));

    return {
      creators: mappedCreators,
      total,
      page,
      limit,
    };
  }

  /**
   * Get curated categories with creator counts
   */
  async getCategories(): Promise<CategoryDto[]> {
    const predefinedCategories = [
      { slug: 'cosplay', name: 'Cosplay & Roleplay', description: 'Gaming, anime, and creative costume artistry' },
      { slug: 'fitness', name: 'Fitness & Health', description: 'Workout programs, nutrition tips, and transformation logs' },
      { slug: 'art', name: 'Visual Art & Design', description: 'Digital illustrations, physical art, and creative tutorials' },
      { slug: 'music', name: 'Music & Audio', description: 'Acoustic sessions, beats, and song writing logs' },
      { slug: 'lifestyle', name: 'Lifestyle & Vlogs', description: 'Daily routines, travel journals, and personal vlogs' },
      { slug: 'gaming', name: 'Gaming & Streams', description: 'Stream clips, gaming setups, and co-op highlights' },
    ];

    const results: CategoryDto[] = [];
    for (const cat of predefinedCategories) {
      const count = await this.prisma.creatorProfile.count({
        where: {
          status: 'approved',
          category: { has: cat.slug },
        },
      });
      results.push({
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        creatorCount: count,
      });
    }

    return results;
  }

  /**
   * Get featured and trending creators
   */
  async getFeatured(): Promise<FeaturedCreatorsResponse> {
    const [featured, trending, categories] = await Promise.all([
      this.prisma.creatorProfile.findMany({
        where: { status: 'approved' },
        include: {
          user: true,
          _count: {
            select: { posts: true, followers: true, subscriptions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.prisma.creatorProfile.findMany({
        where: { status: 'approved' },
        include: {
          user: true,
          _count: {
            select: { posts: true, followers: true, subscriptions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      this.getCategories(),
    ]);

    const mapCreator = (c: any): CreatorProfileDto => ({
      id: c.id,
      userId: c.userId,
      handle: c.user?.handle || '',
      displayName: c.user?.displayName || '',
      avatarMediaId: c.user?.avatarMediaId || null,
      bannerMediaId: c.bannerMediaId || null,
      avatarUrl: null,
      bannerUrl: null,
      bio: c.bio || null,
      category: c.category || [],
      isPaid: c.isPaid,
      subscriptionPriceCents: c.subscriptionPriceCents,
      currency: c.currency,
      commentsEnabled: c.commentsEnabled,
      status: c.status as any,
      followerCount: c._count?.followers || 0,
      subscriberCount: c._count?.subscriptions || 0,
      postCount: c._count?.posts || 0,
      mediaCount: 0,
    });

    return {
      featured: featured.map(mapCreator),
      trending: trending.map(mapCreator),
      categories,
    };
  }
}
