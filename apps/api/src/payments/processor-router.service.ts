import { Injectable, Logger } from '@nestjs/common';
import { PaymentProcessor, ProcessorRoutingDecision } from '@lumora/contracts';

export interface RoutePaymentParams {
  amountCents: number;
  currency: string;
  binCountry?: string | null;
  customerIpCountry?: string | null;
  billingCountry?: string | null;
  processorPreference?: PaymentProcessor | null;
}

@Injectable()
export class ProcessorRouterService {
  private readonly logger = new Logger(ProcessorRouterService.name);

  // Health tracking for active processors
  private processorHealth: Record<string, { isHealthy: boolean; consecutiveFailures: number; lastChecked: Date }> = {
    mock_ccbill: { isHealthy: true, consecutiveFailures: 0, lastChecked: new Date() },
    mock_segpay: { isHealthy: true, consecutiveFailures: 0, lastChecked: new Date() },
    mock_epoch: { isHealthy: true, consecutiveFailures: 0, lastChecked: new Date() },
    mock_verotel: { isHealthy: true, consecutiveFailures: 0, lastChecked: new Date() },
    ccbill: { isHealthy: true, consecutiveFailures: 0, lastChecked: new Date() },
    segpay: { isHealthy: true, consecutiveFailures: 0, lastChecked: new Date() },
  };

  /**
   * Intelligently routes payment to primary processor with designated failover (Story E18)
   */
  routePayment(params: RoutePaymentParams): ProcessorRoutingDecision {
    const country = (params.binCountry || params.billingCountry || params.customerIpCountry || 'US').toUpperCase();
    const isHighTicket = params.amountCents > 10000; // > $100

    // Explicit preference if healthy
    if (params.processorPreference && this.isProcessorHealthy(params.processorPreference)) {
      const failover =
        params.processorPreference === 'mock_segpay' || params.processorPreference === 'segpay'
          ? 'mock_ccbill'
          : 'mock_segpay';

      return {
        primaryProcessor: params.processorPreference,
        failoverProcessor: failover,
        routingReason: 'User or account processor preference',
        maxTicketCents: 500000,
      };
    }

    // EU routing optimization (Segpay typically has higher EU card approval rates)
    const euCountries = ['DE', 'FR', 'GB', 'ES', 'IT', 'NL', 'BE', 'SE', 'DK', 'IE', 'PL'];
    if (euCountries.includes(country)) {
      if (this.isProcessorHealthy('mock_segpay')) {
        return {
          primaryProcessor: 'mock_segpay',
          failoverProcessor: 'mock_ccbill',
          routingReason: `Optimized for ${country} European card acceptance & 3DS`,
          maxTicketCents: 300000,
        };
      }
    }

    // High ticket routing
    if (isHighTicket) {
      return {
        primaryProcessor: 'mock_ccbill',
        failoverProcessor: 'mock_segpay',
        routingReason: 'Optimized for high-ticket PPV purchase underwriting',
        maxTicketCents: 1000000,
      };
    }

    // Default North America / Global Routing
    return {
      primaryProcessor: 'mock_ccbill',
      failoverProcessor: 'mock_segpay',
      routingReason: 'Standard high-capacity primary gateway with automatic failover',
      maxTicketCents: 500000,
    };
  }

  isProcessorHealthy(processor: string): boolean {
    const health = this.processorHealth[processor];
    return health ? health.isHealthy : true;
  }

  recordSuccess(processor: string): void {
    if (this.processorHealth[processor]) {
      this.processorHealth[processor].consecutiveFailures = 0;
      this.processorHealth[processor].isHealthy = true;
      this.processorHealth[processor].lastChecked = new Date();
    }
  }

  recordFailure(processor: string): void {
    if (this.processorHealth[processor]) {
      this.processorHealth[processor].consecutiveFailures += 1;
      this.processorHealth[processor].lastChecked = new Date();
      if (this.processorHealth[processor].consecutiveFailures >= 3) {
        this.processorHealth[processor].isHealthy = false;
        this.logger.warn(`🚨 Processor ${processor} marked UNHEALTHY after 3 consecutive failures`);
      }
    }
  }

  getHealthStatus(): Record<string, any> {
    return this.processorHealth;
  }
}
