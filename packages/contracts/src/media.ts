import { z } from 'zod';

export const MediaKindEnum = z.enum(['image', 'video', 'audio']);
export type MediaKind = z.infer<typeof MediaKindEnum>;

export const MediaStatusEnum = z.enum(['uploaded', 'processing', 'in_review', 'approved', 'rejected', 'failed']);
export type MediaStatus = z.infer<typeof MediaStatusEnum>;

export const MediaUploadRequestSchema = z.object({
  filename: z.string().min(1),
  mime: z.string().min(1),
  bytes: z.number().int().positive(),
  kind: MediaKindEnum,
});
export type MediaUploadRequest = z.infer<typeof MediaUploadRequestSchema>;

export const MediaUploadResponseSchema = z.object({
  mediaId: z.string().uuid(),
  uploadUrl: z.string().url(),
  storageKey: z.string(),
  expiresAt: z.string().datetime(),
});
export type MediaUploadResponse = z.infer<typeof MediaUploadResponseSchema>;

export const MediaDtoSchema = z.object({
  id: z.string().uuid(),
  kind: MediaKindEnum,
  status: MediaStatusEnum,
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  durationMs: z.number().int().nullable().optional(),
  thumbUrl: z.string().nullable().optional(),
  blurredUrl: z.string().nullable().optional(),
  playbackUrl: z.string().nullable().optional(),
  isEntitled: z.boolean().default(false),
});
export type MediaDto = z.infer<typeof MediaDtoSchema>;
