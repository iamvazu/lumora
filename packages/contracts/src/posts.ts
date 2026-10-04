import { z } from 'zod';
import { MediaDtoSchema } from './media.js';

export const PostVisibilityEnum = z.enum(['public', 'subscribers', 'ppv', 'tier']);
export type PostVisibility = z.infer<typeof PostVisibilityEnum>;

export const PostStatusEnum = z.enum(['draft', 'scheduled', 'in_review', 'published', 'removed']);
export type PostStatus = z.infer<typeof PostStatusEnum>;

export const CreatePostRequestSchema = z.object({
  body: z.string().max(10000).default(''),
  visibility: PostVisibilityEnum.default('subscribers'),
  priceCents: z.number().int().min(300).max(20000).optional().nullable(), // $3.00 - $200.00 for PPV
  tierId: z.string().uuid().optional().nullable(),
  publishAt: z.string().datetime().optional().nullable(),
  mediaIds: z.array(z.string().uuid()).default([]),
  performerIds: z.array(z.string().uuid()).default([]),
});
export type CreatePostRequest = z.infer<typeof CreatePostRequestSchema>;

export const PostDtoSchema = z.object({
  id: z.string().uuid(),
  creatorId: z.string().uuid(),
  creatorHandle: z.string(),
  creatorDisplayName: z.string(),
  creatorAvatarUrl: z.string().nullable().optional(),
  body: z.string(),
  visibility: PostVisibilityEnum,
  priceCents: z.number().int().nullable().optional(),
  status: PostStatusEnum,
  publishAt: z.string().datetime().nullable().optional(),
  pinned: z.boolean().default(false),
  likeCount: z.number().int().default(0),
  commentCount: z.number().int().default(0),
  isLiked: z.boolean().default(false),
  isBookmarked: z.boolean().default(false),
  isEntitled: z.boolean().default(false),
  media: z.array(MediaDtoSchema).default([]),
  createdAt: z.string().datetime(),
});
export type PostDto = z.infer<typeof PostDtoSchema>;

export const CreateCommentRequestSchema = z.object({
  body: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional().nullable(),
});
export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;

export const CommentDtoSchema = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  userId: z.string().uuid(),
  userHandle: z.string(),
  userDisplayName: z.string(),
  userAvatarUrl: z.string().nullable().optional(),
  body: z.string(),
  parentId: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime(),
});
export type CommentDto = z.infer<typeof CommentDtoSchema>;

export const PostFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
  filter: z.enum(['all', 'subscribed', 'bookmarks']).default('all'),
});
export type PostFeedQuery = z.infer<typeof PostFeedQuerySchema>;
