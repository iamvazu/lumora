# ADR 0009: End-to-End Critical Flows Verification, Security Hardening, and Load Performance

## Status
Accepted (Sprint S12)

## Context
As Lumora progresses towards closed beta readiness, all five core user and money-moving business flows must have end-to-end integration tests validating compliance with regulatory mandates (18 U.S.C. §2257, 18 U.S.C. §2258A, regional age assurance statutes) and financial invariants (strict zero-sum double-entry ledger settlement).

Additionally, production-grade load testing scripts (k6) and OWASP ASVS L2 security hardening must be codified to protect against abuse, enforce SLAs, and ensure compliance.

## Decisions

### 1. End-to-End Test Harness for Critical Flows (A–E)
The platform features automated E2E integration test suites in `apps/api/test/e2e/`:
- **Flow A (`flow-a-creator-onboarding.spec.ts`):** Verifies Fan Signup -> 2FA (TOTP) enforcement -> Creator Application -> Co-Performer 2257 Consent Registration -> Admin / Webhook KYC Approval.
- **Flow B (`flow-b-fan-subscription.spec.ts`):** Verifies Regional Age Gate (Texas HB 1181, UK Online Safety Act) -> Wallet Top-up ($50.00) -> Creator Subscription ($14.99) -> Atomic 80/20 Ledger Split & Entitlement Provisioning.
- **Flow C (`flow-c-ppv-unlock.spec.ts`):** Verifies Creator PPV Post Upload -> Blurred Media Zero-Disclosure Preview -> 1-Click Wallet Unlock -> Instant Zero-Sum Settlement & Unmasked Media Delivery.
- **Flow D (`flow-d-media-moderation.spec.ts`):** Verifies PhotoDNA/PDQ CSAM Hash Match -> Immediate Quarantine, Account Ban & NCMEC Legal Referral (18 U.S.C. §2258A), and Co-Performer Face Mismatch Review Flagging.
- **Flow E (`flow-e-creator-payout.spec.ts`):** Verifies Earnings Maturation Lifecycle (3d/7d) -> 72-Hour Security Aging Enforcement on Payout Methods -> Withdrawal Execution & Double-Entry Ledger Movement (`payout_in_transit`) -> IRS 1099-K & DAC7 Monthly Tax Statements.

### 2. Security Hardening & OWASP ASVS L2
- **Strict Headers:** Helmet middleware with CSP, HSTS, X-Frame-Options: DENY, and X-Content-Type-Options: nosniff.
- **CORS Allowlist:** Origin restricted to authenticated web and admin origins.
- **Idempotency:** 24h caching of `Idempotency-Key` headers on all state-mutating and financial endpoints.
- **PII Scrubbing:** PII and KYC data segregated from application database logs.

### 3. Load & Performance Validation (k6)
Defined k6 performance test harnesses in `tests/load/`:
- `feed-read.js`: Validates p95 read latency < 300ms under 200 concurrent users.
- `purchase-burst.js`: Validates p95 purchase latency < 800ms during simultaneous PPV drops.
- `websocket-chat.js`: Validates sub-500ms handshake and real-time message fan-out under 500 concurrent sockets.

## Consequences
- **Positive:** Guarantees regressions in critical regulatory compliance or financial ledger paths are caught automatically before any release; verifies system meets strict performance SLAs.
