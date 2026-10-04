import { describe, it, expect } from 'vitest';
import {
  Money,
  LedgerEngine,
  LedgerAccountManager,
  LedgerEntry,
} from '../src/index.js';

describe('Money Class', () => {
  it('creates money from integer cents and handles operations', () => {
    const m1 = Money.fromCents(1000n, 'USD');
    const m2 = Money.fromCents(500, 'USD');

    expect(m1.amountCents).toBe(1000n);
    expect(m1.currency).toBe('USD');

    const sum = m1.add(m2);
    expect(sum.amountCents).toBe(1500n);

    const diff = m1.subtract(m2);
    expect(diff.amountCents).toBe(500n);

    const twentyPct = m1.percentage(20);
    expect(twentyPct.amountCents).toBe(200n);

    const fiveBps = m1.multiplyBps(500); // 5%
    expect(fiveBps.amountCents).toBe(50n);

    expect(m1.isPositive()).toBe(true);
    expect(m1.isNegative()).toBe(false);
    expect(m1.isZero()).toBe(false);

    const zero = Money.zero('USD');
    expect(zero.isZero()).toBe(true);
  });

  it('rejects floating point amounts in constructor and methods', () => {
    expect(() => new Money(10.5, 'USD')).toThrow(TypeError);
    expect(() => Money.fromCents(10.5, 'USD')).toThrow(TypeError);
    const m = Money.fromCents(1000, 'USD');
    expect(() => m.multiplyBps(10.5)).toThrow(TypeError);
    expect(() => m.percentage(10.5)).toThrow(TypeError);
  });

  it('rejects operations between different currencies', () => {
    const usd = Money.fromCents(1000, 'USD');
    const eur = Money.fromCents(1000, 'EUR');

    expect(() => usd.add(eur)).toThrow(/Currency mismatch/);
    expect(() => usd.subtract(eur)).toThrow(/Currency mismatch/);
  });

  it('formats currencies properly', () => {
    expect(Money.fromCents(1999, 'USD').format()).toBe('$19.99');
    expect(Money.fromCents(-1999, 'USD').format()).toBe('-$19.99');
    expect(Money.fromCents(2500, 'EUR').format()).toBe('€25.00');
    expect(Money.fromCents(1550, 'GBP').format()).toBe('£15.50');
    expect(Money.fromCents(3000, 'CAD').format()).toBe('30.00 CAD');
  });

  it('checks equality', () => {
    const m1 = Money.fromCents(1000, 'USD');
    const m2 = Money.fromCents(1000, 'USD');
    const m3 = Money.fromCents(1000, 'EUR');
    const m4 = Money.fromCents(2000, 'USD');

    expect(m1.equals(m2)).toBe(true);
    expect(m1.equals(m3)).toBe(false);
    expect(m1.equals(m4)).toBe(false);
  });
});

describe('Ledger Account Manager', () => {
  it('generates system account keys correctly', () => {
    expect(LedgerAccountManager.getSystemAccountKey('platform', null, 'USD')).toBe('platform:USD');
    expect(LedgerAccountManager.getSystemAccountKey('creator', 'creator-123', 'USD')).toBe('creator:creator-123:USD');
    expect(LedgerAccountManager.isPlatformAccount('platform')).toBe(true);
    expect(LedgerAccountManager.isPlatformAccount('creator')).toBe(false);
  });
});

describe('Ledger Engine & Zero-Sum Invariant', () => {
  it('validates zero sum and rejects imbalanced transactions', () => {
    const validEntries: LedgerEntry[] = [
      { accountId: 'acc-1', amountCents: 1000n },
      { accountId: 'acc-2', amountCents: -1000n },
    ];
    expect(() => LedgerEngine.validateZeroSum(validEntries)).not.toThrow();

    const invalidEntries: LedgerEntry[] = [
      { accountId: 'acc-1', amountCents: 1000n },
      { accountId: 'acc-2', amountCents: -900n },
    ];
    expect(() => LedgerEngine.validateZeroSum(invalidEntries)).toThrow(/Ledger Invariant Violation/);

    expect(() => LedgerEngine.validateZeroSum([{ accountId: 'acc-1', amountCents: 0n }])).toThrow(/at least 2 entries/);
  });

  it('builds standard purchase split (80% creator, 20% platform)', () => {
    const tx = LedgerEngine.buildPurchaseTransaction({
      transactionId: 'tx-1',
      kind: 'subscription_charge',
      referenceType: 'purchase',
      referenceId: 'purch-1',
      postedAt: new Date(),
      split: {
        grossCents: 1000n, // $10.00
        currency: 'USD',
        processorAccountId: 'processor:USD',
        creatorPendingAccountId: 'creator:c1:pending',
        platformRevenueAccountId: 'platform:revenue:USD',
      },
    });

    expect(tx.entries).toHaveLength(3);
    const sum = tx.entries.reduce((acc, e) => acc + e.amountCents, 0n);
    expect(sum).toBe(0n);

    // Processor = +1000
    expect(tx.entries.find((e) => e.accountId === 'processor:USD')?.amountCents).toBe(1000n);
    // Creator = -800 (80%)
    expect(tx.entries.find((e) => e.accountId === 'creator:c1:pending')?.amountCents).toBe(-800n);
    // Platform = -200 (20%)
    expect(tx.entries.find((e) => e.accountId === 'platform:revenue:USD')?.amountCents).toBe(-200n);
  });

  it('builds purchase split with tax, referral share and agency split', () => {
    const tx = LedgerEngine.buildPurchaseTransaction({
      transactionId: 'tx-complex',
      kind: 'ppv_purchase',
      referenceType: 'purchase',
      referenceId: 'purch-2',
      postedAt: new Date(),
      split: {
        grossCents: 10000n, // $100.00
        currency: 'USD',
        processorAccountId: 'processor:USD',
        creatorPendingAccountId: 'creator:c1:pending',
        platformRevenueAccountId: 'platform:revenue:USD',
        taxAccountId: 'tax:FR:USD',
        taxCents: 2000n, // $20.00 tax
        referralPendingAccountId: 'referral:ref1:pending',
        referralBps: 500, // 5% of platform fee
        agencyPendingAccountId: 'agency:ag1:pending',
        agencySplitBps: 2000, // 20% of creator net
      },
    });

    const sum = tx.entries.reduce((acc, e) => acc + e.amountCents, 0n);
    expect(sum).toBe(0n);
  });

  it('builds wallet spend transaction', () => {
    const tx = LedgerEngine.buildWalletSpendTransaction({
      transactionId: 'tx-wallet',
      kind: 'wallet_spend',
      referenceType: 'purchase',
      referenceId: 'purch-3',
      postedAt: new Date(),
      walletAccountId: 'wallet:fan1:USD',
      creatorPendingAccountId: 'creator:c1:pending',
      platformRevenueAccountId: 'platform:revenue:USD',
      amountCents: 5000n, // $50.00
      currency: 'USD',
    });

    const sum = tx.entries.reduce((acc, e) => acc + e.amountCents, 0n);
    expect(sum).toBe(0n);
  });

  it('builds maturation transaction from pending to available', () => {
    const tx = LedgerEngine.buildMaturationTransaction({
      transactionId: 'tx-mat',
      creatorPendingAccountId: 'creator:c1:pending',
      creatorAvailableAccountId: 'creator:c1:available',
      amountCents: 15000n,
      postedAt: new Date(),
    });

    const sum = tx.entries.reduce((acc, e) => acc + e.amountCents, 0n);
    expect(sum).toBe(0n);
    expect(tx.entries).toHaveLength(2);
  });

  it('builds refund transaction perfectly reversing original postings', () => {
    const original = LedgerEngine.buildPurchaseTransaction({
      transactionId: 'tx-orig',
      kind: 'ppv_purchase',
      referenceType: 'purchase',
      referenceId: 'purch-orig',
      postedAt: new Date(),
      split: {
        grossCents: 2500n,
        currency: 'USD',
        processorAccountId: 'processor:USD',
        creatorPendingAccountId: 'creator:c1:pending',
        platformRevenueAccountId: 'platform:revenue:USD',
      },
    });

    const refund = LedgerEngine.buildRefundTransaction({
      transactionId: 'tx-refund',
      originalTransaction: original,
      postedAt: new Date(),
      reason: 'Fan request',
    });

    const sum = refund.entries.reduce((acc, e) => acc + e.amountCents, 0n);
    expect(sum).toBe(0n);

    // Each refund entry is exact negative of original
    for (let i = 0; i < original.entries.length; i++) {
      expect(refund.entries[i]?.amountCents).toBe(-original.entries[i]!.amountCents);
    }
  });

  it('Property-Based Test: 10,000 random postings all maintain 0 sum invariant', () => {
    for (let i = 0; i < 10000; i++) {
      // Random price between 100 ($1.00) and 100000 ($1000.00)
      const randomGross = BigInt(Math.floor(Math.random() * 99900) + 100);
      const hasTax = i % 3 === 0;
      const taxCents = hasTax ? randomGross / 5n : 0n; // 20% tax if present
      const hasReferral = i % 4 === 0;
      const hasAgency = i % 5 === 0;

      const tx = LedgerEngine.buildPurchaseTransaction({
        transactionId: `tx-prop-${i}`,
        kind: 'subscription_charge',
        referenceType: 'purchase',
        referenceId: `purch-${i}`,
        postedAt: new Date(),
        split: {
          grossCents: randomGross,
          currency: 'USD',
          processorAccountId: 'processor:USD',
          creatorPendingAccountId: 'creator:c1:pending',
          platformRevenueAccountId: 'platform:revenue:USD',
          taxAccountId: hasTax ? 'tax:VAT:USD' : undefined,
          taxCents: hasTax ? taxCents : undefined,
          referralPendingAccountId: hasReferral ? 'referral:r1:pending' : undefined,
          referralBps: hasReferral ? 500 : undefined,
          agencyPendingAccountId: hasAgency ? 'agency:a1:pending' : undefined,
          agencySplitBps: hasAgency ? 2000 : undefined,
        },
      });

      const total = tx.entries.reduce((acc, e) => acc + e.amountCents, 0n);
      expect(total).toBe(0n);
    }
  });
});
