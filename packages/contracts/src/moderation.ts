import { z } from 'zod';

export const ReportReasonEnum = z.enum([
  'csam',
  'underage',
  'non_consensual',
  'violence',
  'hate_speech',
  'copyright_dmca',
  'spam_fraud',
  'other',
]);
export type ReportReason = z.infer<typeof ReportReasonEnum>;

export const ModerationTargetTypeEnum = z.enum(['post', 'creator', 'message', 'media']);
export type ModerationTargetType = z.infer<typeof ModerationTargetTypeEnum>;

export const ModerationCaseStatusEnum = z.enum(['open', 'escalated', 'actioned', 'dismissed']);
export type ModerationCaseStatus = z.infer<typeof ModerationCaseStatusEnum>;

export const ModerationSourceEnum = z.enum(['upload', 'report', 'classifier', 'hash_match', 'dmca', 'ncii']);
export type ModerationSource = z.infer<typeof ModerationSourceEnum>;

export const CreateReportRequestSchema = z.object({
  targetType: ModerationTargetTypeEnum,
  targetId: z.string().uuid(),
  reason: ReportReasonEnum,
  details: z.string().max(2000).optional(),
});
export type CreateReportRequest = z.infer<typeof CreateReportRequestSchema>;

export const ModerationReviewActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'quarantine', 'escalate', 'dismiss']),
  reason: z.string().min(2),
  notes: z.string().max(2000).optional(),
});
export type ModerationReviewAction = z.infer<typeof ModerationReviewActionSchema>;

export const ModerationSignalsSchema = z.object({
  csamMatch: z.boolean().default(false),
  csamHash: z.string().optional(),
  nudityScore: z.number().min(0).max(1).optional(),
  violenceScore: z.number().min(0).max(1).optional(),
  detectedFaceCount: z.number().int().min(0).optional(),
  verifiedPerformerCount: z.number().int().min(0).optional(),
  performerMismatch: z.boolean().optional(),
});
export type ModerationSignals = z.infer<typeof ModerationSignalsSchema>;

export const ModerationQueueItemDtoSchema = z.object({
  id: z.string().uuid(),
  targetType: z.string(),
  targetId: z.string().uuid(),
  source: ModerationSourceEnum,
  priority: z.number().int().min(0).max(2), // 0=P0 (CSAM/Immediate), 1=P1 (Reports), 2=P2 (Standard AI review)
  status: ModerationCaseStatusEnum,
  signals: ModerationSignalsSchema.optional().nullable(),
  mediaPreviewUrl: z.string().optional().nullable(),
  reporterReason: z.string().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ModerationQueueItemDto = z.infer<typeof ModerationQueueItemDtoSchema>;

export const ModeratorWelfarePreferencesSchema = z.object({
  blurByDefault: z.boolean().default(true),
  grayscaleMode: z.boolean().default(true),
  maxSessionMinutes: z.number().int().min(15).max(120).default(60),
  breakReminderMinutes: z.number().int().min(15).max(60).default(30),
});
export type ModeratorWelfarePreferences = z.infer<typeof ModeratorWelfarePreferencesSchema>;
