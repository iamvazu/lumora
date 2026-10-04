import { z } from 'zod';

export const CreatorStatusEnum = z.enum(['draft', 'pending_review', 'approved', 'rejected', 'suspended']);
export type CreatorStatus = z.infer<typeof CreatorStatusEnum>;

export const CreatorProfileDtoSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  handle: z.string(),
  displayName: z.string(),
  avatarMediaId: z.string().uuid().nullable().optional(),
  bannerMediaId: z.string().uuid().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  category: z.array(z.string()),
  isPaid: z.boolean(),
  subscriptionPriceCents: z.number().int().nullable(),
  currency: z.string().length(3),
  commentsEnabled: z.boolean(),
  status: CreatorStatusEnum,
  followerCount: z.number().int().default(0),
  subscriberCount: z.number().int().default(0),
  postCount: z.number().int().default(0),
  mediaCount: z.number().int().default(0),
  isFollowing: z.boolean().optional(),
  isSubscribed: z.boolean().optional(),
});
export type CreatorProfileDto = z.infer<typeof CreatorProfileDtoSchema>;

export const ApplyCreatorRequestSchema = z.object({
  bio: z.string().max(1000).optional(),
  category: z.array(z.string()).min(1, 'Select at least one category'),
  isPaid: z.boolean().default(true),
  subscriptionPriceCents: z.number().int().min(499).max(4999).default(999), // $4.99 - $49.99
  currency: z.string().length(3).default('USD'),
});
export type ApplyCreatorRequest = z.infer<typeof ApplyCreatorRequestSchema>;

export const UpdateCreatorProfileRequestSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(1000).optional(),
  category: z.array(z.string()).optional(),
  isPaid: z.boolean().optional(),
  subscriptionPriceCents: z.number().int().min(499).max(4999).optional(),
  commentsEnabled: z.boolean().optional(),
  avatarMediaId: z.string().uuid().nullable().optional(),
  bannerMediaId: z.string().uuid().nullable().optional(),
});
export type UpdateCreatorProfileRequest = z.infer<typeof UpdateCreatorProfileRequestSchema>;

export const TaxProfileRequestSchema = z.object({
  formType: z.enum(['W-9', 'W-8BEN', 'W-8BEN-E']),
  country: z.string().length(2).toUpperCase(),
  legalName: z.string().min(2),
  taxId: z.string().min(4),
});
export type TaxProfileRequest = z.infer<typeof TaxProfileRequestSchema>;

export const PerformerDtoSchema = z.object({
  id: z.string().uuid(),
  creatorId: z.string().uuid(),
  stageName: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']),
  verificationId: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime(),
});
export type PerformerDto = z.infer<typeof PerformerDtoSchema>;
