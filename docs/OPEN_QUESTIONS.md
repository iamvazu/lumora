# Lumora — Open Questions, Gaps & Architectural Decisions

This document captures ambiguities, trade-offs, and design choices left open by the PRD and Technical Specification v1.0, along with the proposed default decision for each.

---

## 1. Data & Infrastructure

### Q1.1: Local vs Production PII Database Separation
- **Context:** The Tech Spec mandates a separate database `pii` (KYC documents, legal names, tax IDs) with its own credentials and KMS key.
- **Ambiguity:** How should this be handled in local Docker Compose vs Production?
- **Default Proposal:** 
  - **Local/CI:** Docker Compose runs a single PostgreSQL 16 container hosting two logical databases: `lumora_app` and `lumora_pii`.
  - **Staging/Production:** Terraform provisions two isolated RDS instances; the `pii` database uses dedicated IAM roles, AWS KMS envelope encryption, and strict subnetting.
  - **Application Access:** `packages/db` exposes two Prisma/Kysely clients: `prisma.app` and `prisma.pii`.

### Q1.2: DB Trigger for Zero-Sum Ledger Invariant
- **Context:** Story E7-1 mandates that any attempt to commit a ledger transaction whose entries do not sum to zero must fail at the database layer.
- **Ambiguity:** Since entries are inserted sequentially or in a batch, an immediate constraint would fail on the first row.
- **Default Proposal:** Use a PostgreSQL `DEFERRABLE INITIALLY DEFERRED` constraint trigger on the `ledger_entries` table. The trigger function verifies `SUM(amount_cents) = 0` grouped by `transaction_id` at transaction commit time.

---

## 2. Authentication & Authorization

### Q2.1: Authorization Library Choice (CASL vs Oso)
- **Context:** The Tech Spec states "Authorization via a policy layer (CASL or Oso) — every resource read checks owner, entitlement, block list, geo-block, moderation status."
- **Default Proposal:** Use **CASL (`@casl/ability`)**. CASL is 100% pure TypeScript, has zero external binary/daemon dependencies, shares ability definitions seamlessly between NestJS backend and Next.js frontend, and supports declarative rule matrices.

### Q2.2: Admin Console Authentication & Domain
- **Context:** Tech Spec specifies `admin.lumora.internal/*` for staff with SSO + hardware-key MFA.
- **Default Proposal:**
  - In local development: `apps/web` runs on `http://localhost:3000`, `apps/admin` runs on `http://localhost:3001`, and `apps/api` runs on `http://localhost:4000`.
  - Admin authentication supports a local development bypass/mock SSO provider (with pre-seeded staff/admin credentials) alongside the production SAML/OIDC SSO + WebAuthn integration.

---

## 3. Media & Transcoding Pipeline

### Q3.1: Video Transcoding in Local Dev vs Production
- **Context:** Production uses AWS MediaConvert / Mux / Bunny Stream to generate HLS renditions (360p, 720p, 1080p) + AES-128 segment encryption keys.
- **Ambiguity:** How to test the complete video pipeline locally without incurring cloud costs?
- **Default Proposal:**
  - Create a `TranscodingProvider` interface in `apps/worker`.
  - **Local/Docker Adapter:** Runs `ffmpeg` in a container to transcode MP4 to multi-bitrate HLS (360p, 720p, 1080p), generates thumbnail and blurred previews, and creates AES-128 keyfiles.
  - **Production Adapter:** AWS MediaConvert / Bunny Stream webhook handler.

### Q3.2: Face Detection & Co-performer Validation
- **Context:** Story E5-4 requires that a media item with 2 detected faces and only 1 linked verified performer cannot auto-approve and must route to human review.
- **Default Proposal:** The moderation worker runs an AI face-detection step (mocked with configurable fixtures in tests/local, and AWS Rekognition / Sightengine in production). The count of detected faces is compared against `content_performers` where `status = 'approved'`. If `faceCount > verifiedPerformerCount`, the media status becomes `in_review` and a case is filed in `moderation_cases`.

---

## 4. Payments, Ledger & Currency

### Q4.1: Multi-Currency & FX Rate Settlement
- **Context:** Tech Spec notes "fans are charged in their display currency where processor supports it; creator balances are held in USD. FX rate captured on the purchase row."
- **Default Proposal:** Base currency for all creator balances, payouts, and ledger accounts is USD (`USD` minor units = cents). When a fan pays in EUR/GBP, the `purchases` record captures `gross_cents` in USD equivalent along with `currency`, `original_amount_cents`, and `fx_rate_bps`. The ledger transactions are posted strictly in USD cents.

### Q4.2: Payout Hold Period Transition
- **Context:** PRD states "7 days new creators, then 3"; Tech Spec states "7 days new creators, 3 days after 90 days in good standing".
- **Default Proposal:** Implement the 90-day threshold: Creator accounts with `approved_at < now - 90 days` AND chargeback rate `< 0.5%` qualify for the 3-day holding period; otherwise 7-day holding period applies.

---

## 5. Age Assurance & Regional Rules

### Q5.1: Regional Enforcement Matrix
- **Context:** Certain regions require hard age verification before viewing explicit content (e.g. UK Online Safety Act, France, US states: TX, VA, UT, LA).
- **Default Proposal:** Maintain a configurable `region_rules` JSON table (cached in Redis):
  - `strict_id_liveness`: Requires government ID + liveness or verified digital ID (e.g. UK, France, specific US states).
  - `card_or_estimation`: Credit card verification or facial age estimation (rest of world).
  - `age_gate_only`: 18+ checkbox gate on landing page before any session.

---

## 6. Sprints & Phasing Summary

All open questions have clear, production-grade defaults that allow unblocked implementation adhering 100% to the PRD and Technical Specification v1.0.
