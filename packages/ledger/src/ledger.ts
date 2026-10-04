import {
  CurrencyCode,
  LedgerEntry,
  LedgerTransaction,
  LedgerTransactionKind,
  PostPurchaseSplitParams,
} from './types.js';
import { Money } from './money.js';

export class LedgerEngine {
  /**
   * Validates that all entries in a transaction sum to exactly zero.
   * Throws an error if the zero-sum invariant is violated.
   */
  static validateZeroSum(entries: LedgerEntry[]): void {
    if (!entries || entries.length < 2) {
      throw new Error(`A valid double-entry transaction must contain at least 2 entries.`);
    }

    let sum = 0n;
    for (const entry of entries) {
      sum += entry.amountCents;
    }

    if (sum !== 0n) {
      throw new Error(`Ledger Invariant Violation: transaction entries sum to ${sum} cents, expected 0.`);
    }
  }

  /**
   * Builds a standard purchase split transaction (Fan purchase -> 20% platform fee, 80% creator net, optional tax, optional referral & agency split)
   */
  static buildPurchaseTransaction(params: {
    transactionId: string;
    kind: LedgerTransactionKind;
    referenceType: string;
    referenceId: string;
    postedAt: Date;
    split: PostPurchaseSplitParams;
  }): LedgerTransaction {
    const { transactionId, kind, referenceType, referenceId, postedAt, split } = params;
    const gross = Money.fromCents(split.grossCents, split.currency);
    const entries: LedgerEntry[] = [];

    // 1. Processor clearing (Fan payment asset incoming: +gross)
    entries.push({
      transactionId,
      accountId: split.processorAccountId,
      amountCents: gross.amountCents,
    });

    // 2. Tax (if any, credited to tax liability: -tax)
    let netAfterTax = gross;
    if (split.taxAccountId && split.taxCents && split.taxCents > 0n) {
      const taxMoney = Money.fromCents(split.taxCents, split.currency);
      entries.push({
        transactionId,
        accountId: split.taxAccountId,
        amountCents: -taxMoney.amountCents,
      });
      netAfterTax = gross.subtract(taxMoney);
    }

    // Standard split: 20% platform fee, 80% creator net
    // Platform fee: 2000 bps
    let platformFee = netAfterTax.multiplyBps(2000);
    // Creator share = netAfterTax - platformFee
    let creatorNet = netAfterTax.subtract(platformFee);

    // Agency split (if applicable, taken from creator's net)
    if (split.agencyPendingAccountId && split.agencySplitBps && split.agencySplitBps > 0) {
      const agencyShare = creatorNet.multiplyBps(split.agencySplitBps);
      creatorNet = creatorNet.subtract(agencyShare);
      entries.push({
        transactionId,
        accountId: split.agencyPendingAccountId,
        amountCents: -agencyShare.amountCents,
      });
    }

    // Referral split (if creator was referred, 5% of platform fee moved from platform to referrer)
    if (split.referralPendingAccountId && split.referralBps && split.referralBps > 0) {
      const referralShare = platformFee.multiplyBps(split.referralBps);
      platformFee = platformFee.subtract(referralShare);
      entries.push({
        transactionId,
        accountId: split.referralPendingAccountId,
        amountCents: -referralShare.amountCents,
      });
    }

    // Creator pending credit (-creatorNet)
    entries.push({
      transactionId,
      accountId: split.creatorPendingAccountId,
      amountCents: -creatorNet.amountCents,
    });

    // Platform revenue credit (-platformFee)
    entries.push({
      transactionId,
      accountId: split.platformRevenueAccountId,
      amountCents: -platformFee.amountCents,
    });

    // Verify zero sum invariant before returning
    this.validateZeroSum(entries);

    return {
      id: transactionId,
      kind,
      referenceType,
      referenceId,
      postedAt,
      entries,
    };
  }

  /**
   * Builds a wallet spend transaction (Fan wallet debit -> creator + platform credit)
   */
  static buildWalletSpendTransaction(params: {
    transactionId: string;
    kind: LedgerTransactionKind;
    referenceType: string;
    referenceId: string;
    postedAt: Date;
    walletAccountId: string;
    creatorPendingAccountId: string;
    platformRevenueAccountId: string;
    amountCents: bigint;
    currency: CurrencyCode;
  }): LedgerTransaction {
    const gross = Money.fromCents(params.amountCents, params.currency);
    const platformFee = gross.multiplyBps(2000);
    const creatorNet = gross.subtract(platformFee);

    const entries: LedgerEntry[] = [
      // Debit fan wallet liability (+decrease liability = positive amount)
      {
        transactionId: params.transactionId,
        accountId: params.walletAccountId,
        amountCents: gross.amountCents,
      },
      // Credit creator pending
      {
        transactionId: params.transactionId,
        accountId: params.creatorPendingAccountId,
        amountCents: -creatorNet.amountCents,
      },
      // Credit platform revenue
      {
        transactionId: params.transactionId,
        accountId: params.platformRevenueAccountId,
        amountCents: -platformFee.amountCents,
      },
    ];

    this.validateZeroSum(entries);

    return {
      id: params.transactionId,
      kind: params.kind,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      postedAt: params.postedAt,
      entries,
    };
  }

  /**
   * Builds a transaction moving matured creator funds from pending to available
   */
  static buildMaturationTransaction(params: {
    transactionId: string;
    creatorPendingAccountId: string;
    creatorAvailableAccountId: string;
    amountCents: bigint;
    postedAt: Date;
  }): LedgerTransaction {
    const entries: LedgerEntry[] = [
      {
        transactionId: params.transactionId,
        accountId: params.creatorPendingAccountId,
        amountCents: params.amountCents, // Debit pending (reducing pending credit)
      },
      {
        transactionId: params.transactionId,
        accountId: params.creatorAvailableAccountId,
        amountCents: -params.amountCents, // Credit available
      },
    ];

    this.validateZeroSum(entries);

    return {
      id: params.transactionId,
      kind: 'payout_hold_release',
      referenceType: 'maturation',
      referenceId: params.transactionId,
      postedAt: params.postedAt,
      entries,
    };
  }

  /**
   * Builds a refund transaction reversing the original entries proportionally
   */
  static buildRefundTransaction(params: {
    transactionId: string;
    originalTransaction: LedgerTransaction;
    postedAt: Date;
    reason: string;
  }): LedgerTransaction {
    // Reversal inverts every signed entry
    const entries: LedgerEntry[] = params.originalTransaction.entries.map((entry) => ({
      transactionId: params.transactionId,
      accountId: entry.accountId,
      amountCents: -entry.amountCents,
    }));

    this.validateZeroSum(entries);

    return {
      id: params.transactionId,
      kind: 'refund',
      referenceType: 'refund',
      referenceId: params.originalTransaction.id,
      postedAt: params.postedAt,
      entries,
    };
  }

  /**
   * Builds a creator payout transaction (Debits creator available, credits processor payout account)
   */
  static buildPayoutTransaction(params: {
    transactionId: string;
    referenceId: string;
    creatorAvailableAccountId: string;
    processorAccountId: string;
    amountCents: bigint;
    postedAt: Date;
  }): LedgerTransaction {
    const entries: LedgerEntry[] = [
      {
        transactionId: params.transactionId,
        accountId: params.creatorAvailableAccountId,
        amountCents: params.amountCents, // Debit creator available (decrease liability)
      },
      {
        transactionId: params.transactionId,
        accountId: params.processorAccountId,
        amountCents: -params.amountCents, // Credit processor / bank
      },
    ];

    this.validateZeroSum(entries);

    return {
      id: params.transactionId,
      kind: 'payout_in_transit',
      referenceType: 'payout',
      referenceId: params.referenceId,
      postedAt: params.postedAt,
      entries,
    };
  }
}
