import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  ChargeParams,
  ChargeResult,
  SubscriptionParams,
  SubscriptionResult,
} from './payment-provider.interface.js';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class MockSegpayProvider implements PaymentProvider {
  readonly name = 'mock_segpay';
  private readonly logger = new Logger(MockSegpayProvider.name);

  async createCharge(params: ChargeParams): Promise<ChargeResult> {
    this.logger.log(`[Segpay Mock] Processing charge of ${params.amountCents} ${params.currency} for user ${params.userId}`);

    return {
      transactionRef: `segpay_txn_${uuidv7()}`,
      status: 'succeeded',
      processor: this.name,
    };
  }

  async createSubscription(params: SubscriptionParams): Promise<SubscriptionResult> {
    this.logger.log(`[Segpay Mock] Creating subscription of ${params.amountCents} ${params.currency}`);

    const nextRebill = new Date();
    nextRebill.setMonth(nextRebill.getMonth() + params.periodMonths);

    return {
      subscriptionRef: `segpay_sub_${uuidv7()}`,
      status: 'active',
      nextRebillAt: nextRebill,
      processor: this.name,
    };
  }

  async cancelSubscription(subscriptionRef: string): Promise<boolean> {
    this.logger.log(`[Segpay Mock] Cancelled sub ${subscriptionRef}`);
    return true;
  }

  async refund(transactionRef: string, amountCents: number): Promise<{ refundRef: string; status: 'succeeded' }> {
    this.logger.log(`[Segpay Mock] Refunded ${amountCents} cents on ${transactionRef}`);
    return {
      refundRef: `segpay_ref_${uuidv7()}`,
      status: 'succeeded',
    };
  }

  async verifyWebhook(_payload: any, _signature?: string): Promise<boolean> {
    return true;
  }
}
