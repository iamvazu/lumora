import { z } from 'zod';

export const StreamAccessSchema = z.enum(['subscribers', 'ticketed', 'free_followers']);
export type StreamAccess = z.infer<typeof StreamAccessSchema>;

export const StreamStatusSchema = z.enum(['scheduled', 'live', 'ended', 'removed']);
export type StreamStatus = z.infer<typeof StreamStatusSchema>;

export const CreateStreamSchema = z.object({
  title: z.string().min(1).max(200),
  access: StreamAccessSchema.default('subscribers'),
  ticketPriceCents: z.number().int().min(100).max(100000).optional(), // $1.00 - $1,000.00
  tipGoalCents: z.number().int().min(500).max(1000000).optional(), // $5.00 - $10,000.00
  scheduledAt: z.string().datetime().optional(),
});
export type CreateStreamRequest = z.infer<typeof CreateStreamSchema>;

export const StreamDtoSchema = z.object({
  id: z.string().uuid(),
  creatorId: z.string().uuid(),
  creatorHandle: z.string(),
  creatorDisplayName: z.string(),
  creatorAvatarUrl: z.string().nullable(),
  title: z.string(),
  access: StreamAccessSchema,
  ticketPriceCents: z.number().int().nullable(),
  status: StreamStatusSchema,
  roomName: z.string(),
  scheduledAt: z.string().nullable(),
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
  peakViewers: z.number().int(),
  currentViewers: z.number().int(),
  tipGoalCents: z.number().int().nullable(),
  tipProgressCents: z.number().int(),
  isEntitled: z.boolean(),
  createdAt: z.string(),
});
export type StreamDto = z.infer<typeof StreamDtoSchema>;

export const JoinStreamResponseSchema = z.object({
  streamId: z.string().uuid(),
  roomName: z.string(),
  livekitToken: z.string(),
  serverUrl: z.string(),
  isPublisher: z.boolean(),
  expiresAt: z.string(),
});
export type JoinStreamResponse = z.infer<typeof JoinStreamResponseSchema>;

export const StreamChatSendSchema = z.object({
  body: z.string().min(1).max(500),
  tipAmountCents: z.number().int().min(100).max(50000).optional(), // Optional tip with chat message
});
export type StreamChatSendRequest = z.infer<typeof StreamChatSendSchema>;

export const StreamChatMessageDtoSchema = z.object({
  id: z.string().uuid(),
  streamId: z.string().uuid(),
  userId: z.string().uuid(),
  userHandle: z.string(),
  userDisplayName: z.string(),
  userAvatarUrl: z.string().nullable(),
  body: z.string(),
  tipAmountCents: z.number().int().nullable(),
  createdAt: z.string(),
});
export type StreamChatMessageDto = z.infer<typeof StreamChatMessageDtoSchema>;
