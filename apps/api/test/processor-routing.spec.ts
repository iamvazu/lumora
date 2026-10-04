import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessorRouterService } from '../src/payments/processor-router.service.js';
import { PaymentsService } from '../src/payments/payments.service.js';
import { VatTaxService } from '../src/payments/vat-tax.service.js';

describe('Dual Processor Routing & Failover Matrix (Epic E18)', () => {
  let routerService: ProcessorRouterService;
  let paymentsService: PaymentsService;

  const mockCCBill = {
    name: 'mock_ccbill',
    createCharge: vi.fn(),
    createSubscription: vi.fn(),
  };

  const mockSegpay = {
    name: 'mock_segpay',
    createCharge: vi.fn(),
    createSubscription: vi.fn(),
  };

  const mockPrisma: any = {
    payment: {
      create: vi.fn(({ data }) => Promise.resolve({ id: `pay_${Date.now()}`, ...data })),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    routerService = new ProcessorRouterService();
    paymentsService = new PaymentsService(
      mockPrisma,
      mockCCBill as any,
      mockSegpay as any,
      routerService,
      new VatTaxService()
    );
  });

  it('routes European cards to Segpay as primary processor', () => {
    const decision = routerService.routePayment({
      amountCents: 2500,
      currency: 'USD',
      binCountry: 'FR',
      customerIpCountry: 'FR',
    });

    expect(decision.primaryProcessor).toBe('mock_segpay');
    expect(decision.failoverProcessor).toBe('mock_ccbill');
    expect(decision.routingReason).toContain('European');
  });

  it('routes High-Ticket PPV purchases (> $100) to CCBill primary', () => {
    const decision = routerService.routePayment({
      amountCents: 20000, // $200
      currency: 'USD',
      binCountry: 'US',
    });

    expect(decision.primaryProcessor).toBe('mock_ccbill');
    expect(decision.failoverProcessor).toBe('mock_segpay');
    expect(decision.routingReason).toContain('high-ticket');
  });

  it('automatically fails over to secondary processor when primary processor declines', async () => {
    // Primary CCBill returns failed
    mockCCBill.createCharge.mockResolvedValueOnce({
      status: 'failed',
      transactionRef: 'ccbill-decline-123',
    });

    // Secondary Segpay succeeds
    mockSegpay.createCharge.mockResolvedValueOnce({
      status: 'succeeded',
      transactionRef: 'segpay-success-456',
    });

    const res = await paymentsService.processDirectCharge('mock_ccbill', {
      amountCents: 5000,
      currency: 'USD',
      token: 'tok_card_test',
    });

    expect(mockCCBill.createCharge).toHaveBeenCalledTimes(1);
    expect(mockSegpay.createCharge).toHaveBeenCalledTimes(1);
    expect(res.failoverAttempted).toBe(true);
    expect(res.processorUsed).toBe('mock_segpay');
    expect(res.status).toBe('succeeded');
  });

  it('tracks processor consecutive failures and triggers unhealthy status', () => {
    routerService.recordFailure('mock_ccbill');
    routerService.recordFailure('mock_ccbill');
    expect(routerService.isProcessorHealthy('mock_ccbill')).toBe(true);

    routerService.recordFailure('mock_ccbill'); // 3rd failure
    expect(routerService.isProcessorHealthy('mock_ccbill')).toBe(false);

    routerService.recordSuccess('mock_ccbill');
    expect(routerService.isProcessorHealthy('mock_ccbill')).toBe(true);
  });
});
