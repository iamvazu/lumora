# ADR 0008: Real-Time Direct Messaging, Mass Broadcasts, Creator Payout Lifecycle, and Financial Statements

## Status
Accepted (Phase 5 / Sprint S10–S11)

## Context
Lumora's creator monetization model relies heavily on direct creator-to-fan engagement (messaging, pay-per-view media unlocks, tipping) and automated, compliant creator earnings distribution.

The platform requires:
1. Low-latency, end-to-end 1:1 direct messaging with real-time delivery, typing indicators, and read receipts.
2. PPV (Pay-Per-View) media attachment masking in chats with zero-disclosure previews before purchase.
3. Agency chatter staff attribution (`sentByStaffId`) for B2B multi-creator account management transparency.
4. Asynchronous batched Mass Message broadcasts (5/hr rate-limited) segmented by subscriber status (`all_subscribers`, `expired_subscribers`, `top_spenders`) with automatic blocklist filtering.
5. Creator balance maturation lifecycle (7-day holding duration for accounts < 90 days, 3-day holding duration for mature accounts).
6. Security controls against account takeover attacks (72-hour payout method aging cooldown, P0 moderation case blocks, and manual review queues for withdrawals exceeding $10,000).
7. Zero-sum double-entry ledger integration for all payout disbursements (`payout_in_transit`).
8. Monthly earnings statements conforming to US 1099-K and EU DAC7 compliance requirements.

## Decisions

### 1. Hybrid WebSocket & REST Messaging Architecture
- **Transport:** WebSocket Gateway (`MessagingGateway` at `/v1/ws`) handles real-time bidirectional push events (new messages, typing indicators, read receipts, and online status).
- **Persistence & Entitlement:** REST endpoints (`/v1/conversations`, `/v1/conversations/:id/messages`) handle conversational history with server-side PPV masking and media decryption entitlement checks.
- **PPV Media Masking:** Locked messages obfuscate media URLs (`mediaUrl: null`, `thumbnailUrl: blurredUrl`) until the recipient purchases the unlock via ledger balance/payment card.

### 2. Mass Broadcast Asynchronous Fan-Out
- **Rate Limit:** Creators are constrained to 5 mass broadcasts per hour.
- **Queueing:** Scheduled and immediate mass broadcasts are stored in `MassMessage` with status `queued`.
- **Worker Fan-Out:** `MassMessageProcessor` loads target subscriber cohorts in batched chunks of 1,000, evaluates blocklists, and inserts individual `DirectMessage` records into conversation threads without duplicating heavy media assets.

### 3. Creator Payout Safeguards & Maturation
- **Maturation Rules:**
  - Standard/New Creators (< 90 days active): 7-day rolling hold on earned net funds.
  - Mature Creators (>= 90 days active, clean trust score): 3-day rolling hold.
- **Worker Maturation Batch:** `BalanceMaturationProcessor` runs hourly to promote matured funds from `pendingCents` to `availableCents`.
- **Security Aging Window:** Newly created or edited payout bank/crypto methods enter a 72-hour `PENDING_VERIFICATION` cooldown window before they can receive withdrawals.
- **Moderation Payout Hold:** Any open or escalated P0 Trust & Safety / 18 U.S.C. §2257 moderation cases automatically freeze payout execution.
- **Large Payout Review Threshold:** Withdrawals > $10,000 USD (1,000,000 cents) are flagged for dual-admin compliance review (`requiresManualReview: true`).

### 4. Double-Entry Ledger Movement for Payouts
- Payout execution invokes `buildPayoutTransaction` in `@lumora/ledger`:
  - **Debit:** Creator Available Balance (`ownerType: creator`, `currency: USD`)
  - **Credit:** Payout Gateway Clearing Account (`ownerType: processor`, `currency: USD`)
  - **Transaction Kind:** `payout_in_transit`
  - **Invariants:** 100% zero-sum balance maintained.

### 5. Compliance & Statements (1099-K & DAC7)
- Statement generation aggregates gross earnings, platform commission (20%), refund debits, and net payouts for any calendar month.
- Supports standardized export for US IRS 1099-K and EU DAC7 reporting.

## Consequences
- **Positive:** Robust protection against fraud and account takeovers; scalable real-time chat with minimal server memory footprint; complete financial auditability.
- **Operational:** Admins must monitor the manual payout review queue for high-earning creators.
