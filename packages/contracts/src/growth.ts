import { z } from 'zod';

// -------------------------------------------------------------
// REFERRALS CONTRACTS (Story E17-1)
// -------------------------------------------------------------

export const ReferralDtoSchema = z.object({
  id: z.string().uuid(),
  referrerCreatorId: z.string().uuid(),
  referredCreatorId: z.string().uuid(),
  referredHandle: z.string(),
  referredDisplayName: z.string(),
  shareBps: z.number().int().default(500), // 5% = 500 bps
  totalEarnedCents: z.number().int().default(0),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  isActive: z.boolean(),
});
export type ReferralDto = z.infer<typeof ReferralDtoSchema>;

export const CreatorReferralsSummaryDtoSchema = z.object({
  referralCode: z.string(),
  referralUrl: z.string(),
  sharePercent: z.number().default(5),
  activeReferralsCount: z.number().int().default(0),
  totalCommissionCents: z.number().int().default(0),
  referrals: z.array(ReferralDtoSchema),
});
export type CreatorReferralsSummaryDto = z.infer<typeof CreatorReferralsSummaryDtoSchema>;

// -------------------------------------------------------------
// AGENCY & CHATTER SEATS CONTRACTS (Story E17-2)
// -------------------------------------------------------------

export const AgencyStatusEnum = z.enum(['pending', 'active', 'suspended', 'terminated']);
export type AgencyStatus = z.infer<typeof AgencyStatusEnum>;

export const AgencyCreatorStatusEnum = z.enum(['invited', 'active', 'ended']);
export type AgencyCreatorStatus = z.infer<typeof AgencyCreatorStatusEnum>;

export const AgencyMemberRoleEnum = z.enum(['owner', 'manager', 'chatter']);
export type AgencyMemberRole = z.infer<typeof AgencyMemberRoleEnum>;

export const CreateAgencyRequestSchema = z.object({
  legalEntityRef: z.string().min(3).max(100),
});
export type CreateAgencyRequest = z.infer<typeof CreateAgencyRequestSchema>;

export const AgencyDtoSchema = z.object({
  id: z.string().uuid(),
  ownerUserId: z.string().uuid(),
  legalEntityRef: z.string(),
  status: AgencyStatusEnum,
  creatorCount: z.number().int().default(0),
  memberCount: z.number().int().default(0),
  createdAt: z.string().datetime(),
});
export type AgencyDto = z.infer<typeof AgencyDtoSchema>;

export const InviteCreatorRequestSchema = z.object({
  creatorHandle: z.string().min(2),
  splitBps: z.number().int().min(100).max(5000), // 1% to 50%
});
export type InviteCreatorRequest = z.infer<typeof InviteCreatorRequestSchema>;

export const AgencyCreatorDtoSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  creatorId: z.string().uuid(),
  creatorHandle: z.string(),
  creatorDisplayName: z.string(),
  splitBps: z.number().int(),
  status: AgencyCreatorStatusEnum,
  creatorConsentedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type AgencyCreatorDto = z.infer<typeof AgencyCreatorDtoSchema>;

export const AddAgencyMemberRequestSchema = z.object({
  userHandle: z.string().min(2),
  role: AgencyMemberRoleEnum,
  scopes: z.array(z.string()).default(['inbox:read', 'inbox:reply']),
});
export type AddAgencyMemberRequest = z.infer<typeof AddAgencyMemberRequestSchema>;

export const AgencyMemberDtoSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  userId: z.string().uuid(),
  userHandle: z.string(),
  userDisplayName: z.string(),
  role: AgencyMemberRoleEnum,
  scopes: z.array(z.string()),
  createdAt: z.string().datetime(),
});
export type AgencyMemberDto = z.infer<typeof AgencyMemberDtoSchema>;

export const AgencyEarningsSummaryDtoSchema = z.object({
  totalGrossCents: z.number().int().default(0),
  agencyCommissionCents: z.number().int().default(0),
  creatorEarningsCents: z.number().int().default(0),
  managedCreatorsCount: z.number().int().default(0),
});
export type AgencyEarningsSummaryDto = z.infer<typeof AgencyEarningsSummaryDtoSchema>;
