export interface ChargeParams {
  amountCents: number;
  currency: string;
  userId: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

export interface ChargeResult {
  transactionRef: string;
  status: 'succeeded' | 'pending' | 'failed';
  redirectUrl?: string;
  processor: string;
}

export interface SubscriptionParams {
  amountCents: number;
  currency: string;
  userId: string;
  periodMonths: number;
  idempotencyKey: string;
}

export interface SubscriptionResult {
  subscriptionRef: string;
  status: 'active' | 'pending';
  nextRebillAt: Date;
  processor: string;
}

export interface PaymentProvider {
  readonly name: string;
  createCharge(params: ChargeParams): Promise<ChargeResult>;
  createSubscription(params: SubscriptionParams): Promise<SubscriptionResult>;
  cancelSubscription(subscriptionRef: string): Promise<boolean>;
  refund(transactionRef: string, amountCents: number): Promise<{ refundRef: string; status: 'succeeded' }>;
  verifyWebhook(payload: any, signature?: string): Promise<boolean>;
}
