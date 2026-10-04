# ADR 0007: Payments Gateway Abstraction, Double-Entry Fan Ledger, Subscriptions & Instant PPV Entitlements

## Status
Accepted

## Context
Lumora operates in the high-risk adult content creator subscription vertical, requiring redundant payment gateways (CCBill, Segpay), a strict double-entry ledger invariant with zero-sum transactional integrity, multi-tiered subscription pricing with promo campaigns, hourly recurring rebilling with dunning recovery, and sub-second 1-click PPV post unlocks and creator tipping.

## Decisions

1. **Payment Provider Abstraction Layer (`PaymentProvider`)**:
   - Built a uniform payment gateway adapter interface supporting direct charges, recurring subscriptions, refunds, and dunning webhooks.
   - Provided mock implementations (`MockCCBillProvider`, `MockSegpayProvider`) configured for zero external dependencies in local/CI test harnesses.

2. **Immutable Double-Entry Ledger (`@lumora/ledger`) Integration**:
   - All financial movements (top-ups, subscription fees, creator net pending allocations, platform fees, tips) are executed inside atomic database transactions (`tx.ledgerTransaction.create` with `entries`).
   - Every transaction enforces the zero-sum ledger invariant (`sum(debits) - sum(credits) == 0`) with integer cent precision (`bigint`).

3. **Fan Wallet & Responsible Spending Guardrails (Story E7-3)**:
   - Fan wallets store balances in integer cents and enforce optional user-defined `dailyLimitCents` and `monthlyLimitCents`.
   - Any transaction exceeding the configured limits is rejected before charging, protecting users against impulsive spend spikes.

4. **Tiered Subscriptions & Promo Engine (Flow B & Story E8-1)**:
   - Creators can define multiple subscription tiers (1, 3, 6, 12 months) and generate promotional discount codes with expiration and redemption caps.
   - Subscription purchases immediately provision creator-level entitlements and split revenue: 80% to Creator Pending balance and 20% to Platform Revenue.

5. **Hourly Background Rebill & Dunning Flow (Story E8-2)**:
   - Worker background processor evaluates expiring subscriptions hourly.
   - Successfully renewed subscriptions extend the billing window and record double-entry spend transactions.
   - Failed renewals transition to `past_due` and retry across a +1d, +3d, +5d schedule before transition to `expired` and automatic entitlement revocation.

6. **Instant PPV Post Unlocks & Creator Tipping (Flow C & Story E9-1)**:
   - PPV post unlocks execute in sub-800ms via Fan Wallet balance or direct card charge, immediately generating a durable `Entitlement` record for unblurred media streaming.
   - Creator tipping supports custom fan notes and instant wallet debit.

## Consequences
- 100% financial correctness and auditable ledger invariant across all monetization flows.
- High resilience to processor outages via gateway abstraction.
- Built-in responsible spending guardrails for fan accounts.
