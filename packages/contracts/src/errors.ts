import { z } from 'zod';

export const ProblemCodeEnum = z.enum([
  'AGE_VERIFICATION_REQUIRED',
  'KYC_REQUIRED',
  'INSUFFICIENT_FUNDS',
  'PAYMENT_DECLINED',
  'NOT_ENTITLED',
  'GEO_BLOCKED',
  'RATE_LIMITED',
  'INVALID_CREDENTIALS',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_ERROR',
  'IDEMPOTENCY_CONFLICT',
  'INTERNAL_ERROR',
  'CONTENT_MODERATION_FAILED',
]);

export type ProblemCode = z.infer<typeof ProblemCodeEnum>;

export const ProblemDetailsSchema = z.object({
  type: z.string().url(),
  title: z.string(),
  status: z.number().int(),
  code: ProblemCodeEnum,
  detail: z.string(),
  requestId: z.string(),
  invalidParams: z
    .array(
      z.object({
        name: z.string(),
        reason: z.string(),
      })
    )
    .optional(),
});

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;

export class ProblemException extends Error {
  constructor(
    public readonly problem: ProblemDetails,
    options?: ErrorOptions
  ) {
    super(problem.detail, options);
    this.name = 'ProblemException';
  }
}
