export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export type LedgerOwnerType =
  | 'platform'
  | 'creator'
  | 'fan_wallet'
  | 'processor'
  | 'tax'
  | 'reserve'
  | 'referral'
  | 'agency';

export type LedgerTransactionKind =
  | 'subscription_charge'
  | 'renewal_charge'
  | 'ppv_purchase'
  | 'tip'
  | 'bundle_purchase'
  | 'stream_ticket'
  | 'stream_gift'
  | 'wallet_topup'
  | 'wallet_spend'
  | 'payout_hold_release'
  | 'payout_in_transit'
  | 'payout_settled'
  | 'payout_reversed'
  | 'refund'
  | 'chargeback'
  | 'referral_share'
  | 'agency_split'
  | 'tax_collection';

export interface LedgerAccount {
  id: string;
  ownerType: LedgerOwnerType;
  ownerId: string | null;
  currency: CurrencyCode;
}

export interface LedgerEntry {
  id?: string;
  transactionId?: string;
  accountId: string;
  amountCents: bigint; // Signed integer: positive for debit / increase in asset, negative for credit
}

export interface LedgerTransaction {
  id: string;
  kind: LedgerTransactionKind;
  referenceType: string;
  referenceId: string;
  postedAt: Date;
  entries: LedgerEntry[];
}

export interface PostPurchaseSplitParams {
  grossCents: bigint;
  currency: CurrencyCode;
  processorAccountId: string;
  creatorPendingAccountId: string;
  platformRevenueAccountId: string;
  taxAccountId?: string;
  taxCents?: bigint;
  referralPendingAccountId?: string;
  referralBps?: number; // e.g. 500 = 5% of platform fee
  agencyPendingAccountId?: string;
  agencySplitBps?: number; // e.g. 2000 = 20% of creator net
}
