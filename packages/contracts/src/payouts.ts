import { z } from 'zod';

export const CreatePayoutMethodRequestSchema = z.object({
  provider: z.enum(['payoneer', 'sepa', 'swift', 'masspay']),
  details: z.record(z.any()), // e.g. email, IBAN, SWIFT BIC, account number
  isDefault: z.boolean().default(true),
});
export type CreatePayoutMethodRequest = z.infer<typeof CreatePayoutMethodRequestSchema>;

export interface PayoutMethodDto {
  id: string;
  creatorId: string;
  provider: 'payoneer' | 'sepa' | 'swift' | 'masspay';
  maskedDetails: string;
  verifiedAt?: string | null;
  isDefault: boolean;
  createdAt: string;
}

export const RequestPayoutSchema = z.object({
  methodId: z.string().uuid(),
  amountCents: z.number().int().min(2000).max(10000000), // $20 min, $100k max
  currency: z.string().length(3).default('USD'),
});
export type RequestPayoutDto = z.infer<typeof RequestPayoutSchema>;

export interface PayoutDto {
  id: string;
  creatorId: string;
  methodId: string;
  provider: string;
  amountCents: number;
  currency: string;
  status: 'requested' | 'processing' | 'completed' | 'failed' | 'canceled';
  providerRef?: string | null;
  manualReviewRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorBalanceDto {
  creatorId: string;
  pendingCents: number;
  availableCents: number;
  currency: string;
  holdingDays: number; // 7 days (new) or 3 days (mature)
  nextMaturationAt?: string | null;
  canRequestPayout: boolean;
  payoutBlockReason?: string | null;
}

export interface CreatorStatementDto {
  period: string; // e.g. "2026-09"
  grossRevenueCents: number;
  platformFeeCents: number;
  netRevenueCents: number;
  refundsCents: number;
  chargebacksCents: number;
  payoutsTotalCents: number;
  currency: string;
  transactionCount: number;
  taxFormType?: string; // W-9, W-8BEN, DAC7
}
