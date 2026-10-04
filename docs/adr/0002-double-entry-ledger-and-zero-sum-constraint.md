# ADR 0002: Double-Entry Ledger and Zero-Sum DB Invariant

## Status
Accepted

## Context
All financial movements (subscriptions, PPV unlocks, tips, bundles, wallet debits, payouts, refunds, chargebacks, referral splits, and agency splits) must be strictly auditable and tamper-proof. Balance amounts cannot be mutated directly in rows without an underlying balanced transaction.

## Decision
1. All money is stored as integer minor units (`amount_cents bigint`) with ISO-4217 currency (`char(3)`). Floating point numbers are strictly forbidden.
2. Every monetary transaction posts at least two signed ledger entries across system accounts (`platform`, `creator`, `fan_wallet`, `processor`, `tax`, `reserve`, `referral`, `agency`).
3. The zero-sum invariant is enforced at two layers:
   - **Application layer:** `LedgerEngine.validateZeroSum()` ensures $\sum \text{amount\_cents} = 0$ before executing transactions.
   - **Database layer:** PostgreSQL `DEFERRABLE INITIALLY DEFERRED` constraint trigger on `ledger_entries` verifies the zero-sum invariant at transaction commit time.

## Consequences
- Guaranteed auditability and mathematical correctness across all balance calculations.
- Reversible refund and chargeback workflows without data loss.
