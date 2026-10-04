import { z } from 'zod';

export const CreatorAnalyticsSummaryDtoSchema = z.object({
  totalEarningsCents: z.number().int(),
  netEarningsCents: z.number().int(),
  platformFeeCents: z.number().int(),
  activeSubscribersCount: z.number().int(),
  newSubscribersThisMonth: z.number().int(),
  churnRatePercent: z.number(),
  totalViewsCount: z.number().int(),
  averageTipCents: z.number().int(),
});
export type CreatorAnalyticsSummaryDto = z.infer<typeof CreatorAnalyticsSummaryDtoSchema>;

export const RevenueSourceBreakdownSchema = z.object({
  subscriptionsCents: z.number().int(),
  ppvPostsCents: z.number().int(),
  ppvMessagesCents: z.number().int(),
  tipsCents: z.number().int(),
  streamTicketsCents: z.number().int(),
  streamGiftsCents: z.number().int(),
  totalGrossCents: z.number().int(),
});
export type RevenueSourceBreakdownDto = z.infer<typeof RevenueSourceBreakdownSchema>;

export const TimeSeriesPointSchema = z.object({
  date: z.string(), // YYYY-MM-DD or YYYY-MM
  grossCents: z.number().int(),
  netCents: z.number().int(),
  subscriberCount: z.number().int(),
});
export type TimeSeriesPoint = z.infer<typeof TimeSeriesPointSchema>;

export const CreatorEarningsAnalyticsDtoSchema = z.object({
  period: z.string(), // e.g. '30d', '90d', '1y'
  breakdown: RevenueSourceBreakdownSchema,
  timeSeries: z.array(TimeSeriesPointSchema),
});
export type CreatorEarningsAnalyticsDto = z.infer<typeof CreatorEarningsAnalyticsDtoSchema>;

export const TopFanDtoSchema = z.object({
  userId: z.string().uuid(),
  handle: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  totalSpendCents: z.number().int(),
  subscriptionMonths: z.number().int(),
  lastActiveAt: z.string(),
});
export type TopFanDto = z.infer<typeof TopFanDtoSchema>;
