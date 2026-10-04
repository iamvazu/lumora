import { z } from 'zod';

export const PurchaseTypeEnum = z.enum([
  'subscription',
  'renewal',
  'ppv_post',
  'ppv_message',
  'bundle',
  'tip',
  'stream_ticket',
  'stream_gift',
  'paid_dm',
  'wallet_topup',
]);
export type PurchaseType = z.infer<typeof PurchaseTypeEnum>;

export const SubscriptionStatusEnum = z.enum([
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'expired',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;

export const PurchaseRequestSchema = z.object({
  type: PurchaseTypeEnum,
  resourceId: z.string().uuid().optional().nullable(),
  sellerId: z.string().uuid().optional().nullable(),
  paymentSource: z.enum(['wallet', 'card']).default('wallet'),
  amountCents: z.number().int().positive().optional().nullable(),
  message: z.string().max(300).optional().nullable(),
});
export type PurchaseRequest = z.infer<typeof PurchaseRequestSchema>;

export const SubscriptionRequestSchema = z.object({
  creatorId: z.string().uuid(),
  planId: z.string().uuid(),
  promoCode: z.string().optional().nullable(),
  paymentMethod: z.enum(['wallet', 'card']).default('card'),
});
export type SubscriptionRequest = z.infer<typeof SubscriptionRequestSchema>;

export const TipRequestSchema = z.object({
  creatorId: z.string().uuid(),
  amountCents: z.number().int().min(100).max(50000), // $1.00 - $500.00
  context: z.enum(['post', 'message', 'stream', 'profile']),
  resourceId: z.string().uuid().optional().nullable(),
  message: z.string().max(200).optional().nullable(),
});
export type TipRequest = z.infer<typeof TipRequestSchema>;

export const WalletTopupRequestSchema = z.object({
  amountCents: z.number().int().min(500).max(100000), // $5.00 - $1,000.00
  currency: z.string().length(3).default('USD'),
  paymentMethod: z.enum(['mock_ccbill', 'mock_segpay', 'card']).default('card'),
});
export type WalletTopupRequest = z.infer<typeof WalletTopupRequestSchema>;

export const WalletDtoSchema = z.object({
  userId: z.string().uuid(),
  balanceCents: z.number().int(),
  currency: z.string().length(3),
  dailyLimitCents: z.number().int().nullable().optional(),
  monthlyLimitCents: z.number().int().nullable().optional(),
  spentTodayCents: z.number().int().default(0),
  spentThisMonthCents: z.number().int().default(0),
});
export type WalletDto = z.infer<typeof WalletDtoSchema>;

export const UpdateWalletLimitsRequestSchema = z.object({
  dailyLimitCents: z.number().int().min(1000).max(500000).optional().nullable(), // $10 - $5000
  monthlyLimitCents: z.number().int().min(5000).max(2000000).optional().nullable(), // $50 - $20000
});
export type UpdateWalletLimitsRequest = z.infer<typeof UpdateWalletLimitsRequestSchema>;

export const WalletTransactionDtoSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  amountCents: z.number().int(),
  currency: z.string().length(3),
  description: z.string(),
  createdAt: z.string().datetime(),
});
export type WalletTransactionDto = z.infer<typeof WalletTransactionDtoSchema>;

export const SubscriptionPlanDtoSchema = z.object({
  id: z.string().uuid(),
  creatorId: z.string().uuid(),
  tierName: z.string(),
  periodMonths: z.number().int(),
  priceCents: z.number().int(),
  discountPct: z.number().int(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
});
export type SubscriptionPlanDto = z.infer<typeof SubscriptionPlanDtoSchema>;

export const CreateSubscriptionPlanRequestSchema = z.object({
  tierName: z.string().min(1).max(50),
  periodMonths: z.number().int().min(1).max(12),
  priceCents: z.number().int().min(499).max(49999), // $4.99 - $499.99
  discountPct: z.number().int().min(0).max(50).default(0),
});
export type CreateSubscriptionPlanRequest = z.infer<typeof CreateSubscriptionPlanRequestSchema>;

export const PromotionDtoSchema = z.object({
  id: z.string().uuid(),
  creatorId: z.string().uuid(),
  kind: z.enum(['trial', 'discount']),
  trialDays: z.number().int().nullable().optional(),
  discountPct: z.number().int().nullable().optional(),
  maxUses: z.number().int().nullable().optional(),
  used: z.number().int(),
  code: z.string(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
});
export type PromotionDto = z.infer<typeof PromotionDtoSchema>;

export const CreatePromotionRequestSchema = z.object({
  kind: z.enum(['trial', 'discount']),
  trialDays: z.number().int().min(1).max(30).optional().nullable(),
  discountPct: z.number().int().min(5).max(100).optional().nullable(),
  maxUses: z.number().int().min(1).max(10000).optional().nullable(),
  code: z.string().min(3).max(30).toUpperCase(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});
export type CreatePromotionRequest = z.infer<typeof CreatePromotionRequestSchema>;

export const SubscriptionDtoSchema = z.object({
  id: z.string().uuid(),
  fanId: z.string().uuid(),
  creatorId: z.string().uuid(),
  creatorHandle: z.string(),
  creatorDisplayName: z.string(),
  creatorAvatarUrl: z.string().nullable().optional(),
  planId: z.string().uuid(),
  status: SubscriptionStatusEnum,
  currentPeriodStart: z.string().datetime(),
  currentPeriodEnd: z.string().datetime(),
  autoRenew: z.boolean(),
  priceCents: z.number().int(),
  createdAt: z.string().datetime(),
});
export type SubscriptionDto = z.infer<typeof SubscriptionDtoSchema>;

export const PurchaseReceiptDtoSchema = z.object({
  id: z.string().uuid(),
  type: PurchaseTypeEnum,
  resourceId: z.string().uuid().nullable().optional(),
  grossCents: z.number().int(),
  feeCents: z.number().int(),
  netCents: z.number().int(),
  taxCents: z.number().int().default(0),
  currency: z.string().length(3),
  status: z.enum(['pending', 'succeeded', 'failed', 'refunded', 'charged_back']),
  createdAt: z.string().datetime(),
});
export type PurchaseReceiptDto = z.infer<typeof PurchaseReceiptDtoSchema>;

// -------------------------------------------------------------
// DUAL PROCESSOR ROUTING & FAILOVER (Epic E18)
// -------------------------------------------------------------

export const PaymentProcessorEnum = z.enum([
  'mock_ccbill',
  'mock_segpay',
  'mock_epoch',
  'mock_verotel',
  'ccbill',
  'segpay',
]);
export type PaymentProcessor = z.infer<typeof PaymentProcessorEnum>;

export const ProcessorRoutingDecisionSchema = z.object({
  primaryProcessor: PaymentProcessorEnum,
  failoverProcessor: PaymentProcessorEnum,
  routingReason: z.string(),
  maxTicketCents: z.number().int().optional(),
});
export type ProcessorRoutingDecision = z.infer<typeof ProcessorRoutingDecisionSchema>;

// -------------------------------------------------------------
// GLOBAL & EU VAT CALCULATION ENGINE (Epic E19)
// -------------------------------------------------------------

export const TaxCalculationRequestSchema = z.object({
  amountCents: z.number().int().positive(),
  customerIpCountry: z.string().length(2).optional().nullable(),
  binCountry: z.string().length(2).optional().nullable(),
  billingCountry: z.string().length(2).optional().nullable(),
  billingPostalCode: z.string().optional().nullable(),
});
export type TaxCalculationRequest = z.infer<typeof TaxCalculationRequestSchema>;

export const TaxCalculationResponseSchema = z.object({
  taxableAmountCents: z.number().int(),
  taxRatePercent: z.number(),
  taxAmountCents: z.number().int(),
  totalAmountCents: z.number().int(),
  jurisdiction: z.string(),
  isVatApplicable: z.boolean(),
  evidenceMatch: z.boolean(),
  evidenceCount: z.number().int(),
});
export type TaxCalculationResponse = z.infer<typeof TaxCalculationResponseSchema>;

