import { z } from 'zod';

export const SendMessageRequestSchema = z.object({
  body: z.string().max(5000).default(''),
  priceCents: z.number().int().min(300).max(20000).optional().nullable(),
  mediaIds: z.array(z.string().uuid()).default([]),
  sentByStaffId: z.string().uuid().optional().nullable(),
});
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

export const MassMessageRequestSchema = z.object({
  body: z.string().max(5000),
  priceCents: z.number().int().min(300).max(20000).optional().nullable(),
  mediaIds: z.array(z.string().uuid()).default([]),
  audienceFilter: z.object({
    segment: z.enum(['all_subscribers', 'expired_subscribers', 'top_spenders', 'custom']),
    minSpendCents: z.number().int().optional(),
  }),
  scheduledAt: z.string().datetime().optional().nullable(),
});
export type MassMessageRequest = z.infer<typeof MassMessageRequestSchema>;

export interface MessageMediaDto {
  id: string;
  mediaId: string;
  position: number;
  url?: string;
  thumbnailUrl?: string;
  isLocked: boolean;
  mimeType?: string;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderHandle: string;
  senderDisplayName: string;
  senderAvatarUrl?: string | null;
  sentByStaffId?: string | null;
  body: string;
  priceCents?: number | null;
  isLocked: boolean;
  isUnlocked: boolean;
  isMass: boolean;
  media: MessageMediaDto[];
  readAt?: string | null;
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  creatorId: string;
  creatorUserId: string;
  creatorHandle: string;
  creatorDisplayName: string;
  creatorAvatarUrl?: string | null;
  fanId: string;
  fanHandle: string;
  fanDisplayName: string;
  fanAvatarUrl?: string | null;
  lastMessage?: MessageDto | null;
  lastMessageAt: string;
  unreadCount: number;
}

export interface MassMessageDto {
  id: string;
  creatorId: string;
  body: string;
  priceCents?: number | null;
  audienceFilter: {
    segment: 'all_subscribers' | 'expired_subscribers' | 'top_spenders' | 'custom';
    minSpendCents?: number;
  };
  scheduledAt?: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  recipientCount: number;
  sentCount: number;
  createdAt: string;
}
