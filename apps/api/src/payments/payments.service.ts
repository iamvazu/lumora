import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentProvider, ChargeParams, SubscriptionParams } from './payment-provider.interface.js';
import { MockCCBillProvider } from './mock-ccbill.provider.js';
import { MockSegpayProvider } from './mock-segpay.provider.js';
import { ProcessorRouterService } from './processor-router.service.js';
import { VatTaxService } from './vat-tax.service.js';
import {
  ProblemException,
  PaymentProcessor,
  TaxCalculationRequest,
  TaxCalculationResponse,
} from '@lumora/contracts';

export interface RoutedChargeParams extends ChargeParams {
  binCountry?: string | null;
  customerIpCountry?: string | null;
  billingCountry?: string | null;
  billingPostalCode?: string | null;
  processorPreference?: PaymentProcessor | null;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private providers = new Map<string, PaymentProvider>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly ccbillProvider: MockCCBillProvider,
    private readonly segpayProvider: MockSegpayProvider,
    private readonly routerService: ProcessorRouterService,
    private readonly vatTaxService: VatTaxService,
  ) {
    this.providers.set('mock_ccbill', this.ccbillProvider);
    this.providers.set('ccbill', this.ccbillProvider);
    this.providers.set('mock_segpay', this.segpayProvider);
    this.providers.set('segpay', this.segpayProvider);
    this.providers.set('card', this.ccbillProvider);
  }

  getProvider(name = 'card'): PaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new ProblemException({
        type: 'https://lumora.app/errors/validation-error',
        title: 'Unknown Payment Processor',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: `Payment processor '${name}' is not supported.`,
        requestId: '',
      });
    }
    return provider;
  }

  /**
   * Calculates VAT or digital sales tax (Story E19)
   */
  calculateTax(req: TaxCalculationRequest): TaxCalculationResponse {
    return this.vatTaxService.calculateTax(req);
  }

  /**
   * Retrieves processor health and routing status
   */
  getRoutingStatus() {
    return this.routerService.getHealthStatus();
  }

  /**
   * Charges card with intelligent routing and automatic failover (Story E18 & E19)
   */
  async processDirectCharge(providerName: string, params: RoutedChargeParams) {
    // 1. Calculate VAT/tax if location metadata is present
    const taxRes = this.vatTaxService.calculateTax({
      amountCents: params.amountCents,
      customerIpCountry: params.customerIpCountry,
      binCountry: params.binCountry,
      billingCountry: params.billingCountry,
      billingPostalCode: params.billingPostalCode,
    });

    // 2. Determine primary and failover processor
    const routing = this.routerService.routePayment({
      amountCents: params.amountCents,
      currency: params.currency,
      binCountry: params.binCountry,
      customerIpCountry: params.customerIpCountry,
      billingCountry: params.billingCountry,
      processorPreference: (providerName as any) || params.processorPreference,
    });

    let selectedProviderName = routing.primaryProcessor;
    let provider = this.getProvider(selectedProviderName);
    let failoverAttempted = false;

    this.logger.log(`Charging $${(params.amountCents / 100).toFixed(2)} via primary processor ${selectedProviderName} (reason: ${routing.routingReason})`);

    let result = await provider.createCharge(params);

    // Automatic Failover on primary decline/error
    if (result.status === 'failed') {
      this.logger.warn(`Primary processor ${selectedProviderName} failed. Triggering failover to ${routing.failoverProcessor}`);
      this.routerService.recordFailure(selectedProviderName);

      failoverAttempted = true;
      selectedProviderName = routing.failoverProcessor;
      provider = this.getProvider(selectedProviderName);
      result = await provider.createCharge(params);
    }

    if (result.status === 'failed') {
      this.routerService.recordFailure(selectedProviderName);
      throw new ProblemException({
        type: 'https://lumora.app/errors/payment-declined',
        title: 'Payment Declined',
        status: 402,
        code: 'PAYMENT_DECLINED',
        detail: 'The transaction was declined by primary and failover payment gateways.',
        requestId: '',
      });
    }

    this.routerService.recordSuccess(selectedProviderName);

    // Record Payment in database
    const payment = await this.prisma.payment.create({
      data: {
        processor: (selectedProviderName as any) || 'mock_ccbill',
        processorTxnRef: result.transactionRef,
        method: 'card',
        amountCents: params.amountCents,
        currency: params.currency,
        status: 'succeeded',
      },
    });

    return {
      paymentId: payment.id,
      transactionRef: result.transactionRef,
      processorUsed: selectedProviderName,
      status: result.status,
      taxAmountCents: taxRes.taxAmountCents,
      taxRatePercent: taxRes.taxRatePercent,
      jurisdiction: taxRes.jurisdiction,
      failoverAttempted,
    };
  }

  async processSubscription(providerName: string, params: SubscriptionParams) {
    const provider = this.getProvider(providerName);
    const result = await provider.createSubscription(params);
    return result;
  }
}
