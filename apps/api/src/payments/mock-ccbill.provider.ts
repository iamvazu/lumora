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
export class MockCCBillProvider implements PaymentProvider {
  readonly name = 'mock_ccbill';
  private readonly logger = new Logger(MockCCBillProvider.name);

  async createCharge(params: ChargeParams): Promise<ChargeResult> {
    this.logger.log(`[CCBill Mock] Processing charge of ${params.amountCents} ${params.currency} for user ${params.userId}`);

    // Simulation: if amount is 999999 cents ($9999.99), simulate declined card
    if (params.amountCents === 999999) {
      return {
        transactionRef: `ccbill_declined_${uuidv7()}`,
        status: 'failed',
        processor: this.name,
      };
    }

    return {
      transactionRef: `ccbill_txn_${uuidv7()}`,
      status: 'succeeded',
      processor: this.name,
    };
  }

  async createSubscription(params: SubscriptionParams): Promise<SubscriptionResult> {
    this.logger.log(`[CCBill Mock] Setting up recurring sub of ${params.amountCents} ${params.currency} (${params.periodMonths} mo)`);

    const nextRebill = new Date();
    nextRebill.setMonth(nextRebill.getMonth() + params.periodMonths);

    return {
      subscriptionRef: `ccbill_sub_${uuidv7()}`,
      status: 'active',
      nextRebillAt: nextRebill,
      processor: this.name,
    };
  }

  async cancelSubscription(subscriptionRef: string): Promise<boolean> {
    this.logger.log(`[CCBill Mock] Cancelled recurring sub ${subscriptionRef}`);
    return true;
  }

  async refund(transactionRef: string, amountCents: number): Promise<{ refundRef: string; status: 'succeeded' }> {
    this.logger.log(`[CCBill Mock] Issued refund of ${amountCents} cents on ${transactionRef}`);
    return {
      refundRef: `ccbill_ref_${uuidv7()}`,
      status: 'succeeded',
    };
  }

  async verifyWebhook(_payload: any, _signature?: string): Promise<boolean> {
    return true;
  }
}
