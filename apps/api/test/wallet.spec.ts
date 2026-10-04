import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletService } from '../src/wallet/wallet.service.js';
import { PaymentsService } from '../src/payments/payments.service.js';

describe('WalletService (E8 Fan Wallet & Spending Protection)', () => {
  let service: WalletService;
  let mockPrisma: any;
  let mockPayments: any;

  beforeEach(() => {
    mockPrisma = {
      wallet: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      ledgerAccount: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      ledgerTransaction: {
        create: vi.fn(),
      },
      purchase: {
        create: vi.fn(),
        findMany: vi.fn().mockResolvedValue([]),
      },
      $transaction: vi.fn(async (cb) => {
        if (typeof cb === 'function') return cb(mockPrisma);
        return Promise.all(cb);
      }),
    };

    mockPayments = {
      processDirectCharge: vi.fn().mockResolvedValue({
        paymentId: 'pay-ccbill-123',
        status: 'succeeded',
        providerName: 'ccbill',
      }),
    };

    service = new WalletService(mockPrisma, mockPayments);
  });

  it('should initialize and return a wallet with default spending limits', async () => {
    mockPrisma.wallet.findUnique.mockResolvedValue(null);
    mockPrisma.wallet.create.mockResolvedValue({
      id: 'wallet-1',
      userId: 'user-1',
      balanceCents: 5000n,
      currency: 'USD',
      dailyLimitCents: 20000,
      monthlyLimitCents: 100000,
    });
    mockPrisma.purchase.findMany
      .mockResolvedValueOnce([{ grossCents: 2000 }]) // daily spent
      .mockResolvedValueOnce([{ grossCents: 15000 }]); // monthly spent

    const res = await service.getWallet('user-1');
    expect(res.balanceCents).toBe(5000);
    expect(res.dailyLimitCents).toBe(20000);
    expect(res.spentTodayCents).toBe(2000);
    expect(res.spentThisMonthCents).toBe(15000);
  });

  it('should perform wallet top-up via ledger transaction and payment provider', async () => {
    mockPrisma.ledgerAccount.findFirst
      .mockResolvedValueOnce({ id: 'acc-gateway' })
      .mockResolvedValueOnce({ id: 'acc-fan-wallet' });

    mockPrisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet-1',
      userId: 'user-1',
      balanceCents: 10000n,
      currency: 'USD',
      dailyLimitCents: 20000,
      monthlyLimitCents: 100000,
    });

    const res = await service.topup('user-1', {
      amountCents: 5000,
      paymentMethod: 'card',
      currency: 'USD',
    });

    expect(mockPayments.processDirectCharge).toHaveBeenCalledWith(
      'card',
      expect.objectContaining({
        amountCents: 5000,
        currency: 'USD',
      }),
    );
    expect(mockPrisma.ledgerTransaction.create).toHaveBeenCalled();
    expect(res.balanceCents).toBe(10000);
  });

  it('should update spending limit caps safely', async () => {
    mockPrisma.wallet.upsert.mockResolvedValue({
      id: 'wallet-1',
      userId: 'user-1',
      dailyLimitCents: 15000,
      monthlyLimitCents: 80000,
      balanceCents: 3000n,
      currency: 'USD',
    });
    mockPrisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet-1',
      userId: 'user-1',
      dailyLimitCents: 15000,
      monthlyLimitCents: 80000,
      balanceCents: 3000n,
      currency: 'USD',
    });

    const res = await service.updateLimits('user-1', {
      dailyLimitCents: 15000,
      monthlyLimitCents: 80000,
    });

    expect(res.dailyLimitCents).toBe(15000);
    expect(res.monthlyLimitCents).toBe(80000);
  });

  it('should reject spending limit updates if daily limit exceeds monthly limit', async () => {
    await expect(
      service.updateLimits('user-1', {
        dailyLimitCents: 60000,
        monthlyLimitCents: 50000,
      }),
    ).rejects.toThrow();
  });
});
