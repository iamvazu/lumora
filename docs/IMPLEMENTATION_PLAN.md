# Lumora — Master Implementation Plan

This document maps all 18 epics (E0–E17) and 20 sprints from the Technical Specification to concrete tasks, files, tests, and acceptance criteria in strict build order.

---

## Progress Overview

- [x] **Sprint S1–S3: Foundations, Design System, Auth & Accounts (E0, E1)**
- [x] **Sprint S4–S5: Age Assurance, Creator KYC & Media Pipeline (E2, E3, E4)**
- [ ] **Sprint S6–S7: Moderation, Profiles, Posts & Vault (E5, E6, E11)**
- [ ] **Sprint S8–S9: Payments Abstraction, Ledger, Subscriptions & PPV (E7, E8, E9)**
- [ ] **Sprint S10–S11: Messaging, Mass Messages, Payouts & Notifications (E10, E12, E13)**
- [ ] **Sprint S12: Hardening, E2E Test Verification & Closed Beta Readiness**
- [ ] **Sprint S13–S15: Live Streaming & Analytics (E14, E15)**
- [ ] **Sprint S16–S17: Discovery, Search, Referrals & Agency Accounts (E16, E17)**
- [ ] **Sprint S18–S20: Second Processor, Tax Engine & Public Launch Polish**

---

## Sprint S1–S3 (Weeks 1–6): Platform Foundations & Auth (E0, E1)

### Epic E0: Platform Foundations
- [x] **E0.1 Monorepo & Tooling Setup**
  - **Files:** `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.json`, `.editorconfig`, `.gitignore`
  - **Tasks:** Initialize Turborepo with pnpm workspaces; configure TypeScript strict mode; set up ESLint and Prettier presets in `packages/config`.
  - **Tests:** `pnpm turbo build`, `pnpm turbo lint`.
- [x] **E0.2 Local Infrastructure (Docker Compose)**
  - **Files:** `docker-compose.yml`, `infra/local/init-db.sql`, `.env.example`
  - **Tasks:** Provision PostgreSQL 16 (two DBs: `lumora_app` and `lumora_pii`), Redis 7, MinIO (S3 compatible), MailHog (SMTP), LiveKit server.
  - **Tests:** Container healthchecks; database connectivity test.
- [x] **E0.3 Database Packages & Full Prisma Schema**
  - **Files:** `packages/db/prisma/schema.prisma`, `packages/db/src/client.ts`, `packages/db/src/seed.ts`
  - **Tasks:** Implement all 30+ tables, enums, foreign keys, unique constraints, and indexes according to Tech Spec data model; add PostgreSQL migration and seed scripts.
  - **Tests:** Prisma schema validation, migration apply, seed execution test.
- [x] **E0.4 Double-Entry Ledger Core Library (`packages/ledger`)**
  - **Files:** `packages/ledger/src/index.ts`, `packages/ledger/src/accounts.ts`, `packages/ledger/src/transactions.ts`, `packages/ledger/src/types.ts`
  - **Tasks:** Pure TypeScript ledger library; define chart of accounts (`platform`, `creator`, `fan_wallet`, `processor`, `tax`, `reserve`, `referral`, `agency`); implement zero-sum posting validation.
  - **Tests:** `packages/ledger/test/ledger.spec.ts` (100% branch coverage with property-based tests).
- [x] **E0.5 Shared Contracts & OpenAPI (`packages/contracts`)**
  - **Files:** `packages/contracts/src/schemas/*`, `packages/contracts/src/errors.ts`, `packages/contracts/src/index.ts`
  - **Tasks:** Zod validation schemas for all `/v1` endpoints; RFC 9457 Problem Details error definitions; OpenAPI 3.1 generator.
  - **Tests:** Schema validation unit tests; OpenAPI spec compliance tests.
- [x] **E0.6 UI Design System (`packages/ui`)**
  - **Files:** `packages/ui/src/components/*` (`Button`, `Input`, `Card`, `Modal`, `LockedMedia`, `PriceInput`, `Stepper`, `Badge`), `packages/ui/src/styles/theme.css`
  - **Tasks:** Original premium dark-mode design system with Tailwind + Radix UI primitives; WCAG 2.2 AA compliance.
  - **Tests:** Component unit tests with React Testing Library.
- [x] **E0.7 CI/CD Pipeline**
  - **Files:** `.github/workflows/ci.yml`, `.github/workflows/security.yml`
  - **Tasks:** Setup GitHub Actions workflow for linting, typechecking, Vitest tests, Prisma migration checks, and Semgrep SAST.
  - **Tests:** Full workflow run in CI.

### Epic E1: Accounts, Auth, 2FA & Sessions
- [x] **E1.1 NestJS API Auth Core**
  - **Files:** `apps/api/src/auth/*`, `apps/api/src/common/guards/*`, `apps/api/src/common/filters/problem-exception.filter.ts`
  - **Tasks:** Implement JWT access token (15m in memory) + rotating refresh token (30d httpOnly cookie); Argon2id password hashing; breached-password checking; RFC 9457 error handler; rate limiting middleware (300 req/min user, 20/hr IP); idempotency interceptor.
  - **Endpoints:** `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/verify-email`, `POST /auth/magic-link`.
  - **Tests:** `apps/api/test/auth.e2e-spec.ts`.
- [x] **E1.2 TOTP 2FA & WebAuthn**
  - **Files:** `apps/api/src/auth/totp/*`, `apps/api/src/auth/guards/two-factor.guard.ts`
  - **Tasks:** TOTP secret generation, QR code output, backup codes, mandatory 2FA enforcement for creators/agencies.
  - **Endpoints:** `POST /auth/2fa/setup`, `POST /auth/2fa/verify`, `DELETE /auth/2fa`.
  - **Tests:** TOTP setup, verification, and blocking guard tests.
- [x] **E1.3 Account & Session Management**
  - **Files:** `apps/api/src/account/*`
  - **Tasks:** Active session listing, device tracking, remote session revocation, profile update, GDPR data export initiation, account deletion.
  - **Endpoints:** `GET/PATCH /me`, `GET /me/sessions`, `DELETE /me/sessions/:id`, `POST /me/export`, `DELETE /me`.
  - **Tests:** Account controller and session revocation unit/integration tests.
- [x] **E1.4 Next.js Web App Auth & Security Views**
  - **Files:** `apps/web/src/app/(auth)/signup/page.tsx`, `apps/web/src/app/(auth)/signin/page.tsx`, `apps/web/src/app/(auth)/2fa/page.tsx`, `apps/web/src/app/(dashboard)/settings/security/page.tsx`
  - **Tasks:** Client authentication flows, session cookie handling, 2FA challenge screens, security settings, active session manager.
  - **Tests:** Web auth integration and form validation tests.

---

## Sprint S4–S5 (Weeks 7–10): Age Assurance, Creator KYC & Media Pipeline (E2, E3, E4)

### Epic E2: Age Assurance + Region Rules
- [x] **E2.1 Age Assurance Service & Policy Engine**
  - **Files:** `apps/api/src/age/*`, `apps/api/src/common/guards/age-verification.guard.ts`
  - **Tasks:** GeoIP-based region rules engine (strict ID/liveness, facial estimation, credit card check, or 18+ landing gate); vendor SDK session generator.
  - **Endpoints:** `POST /age-verification/session`, `GET /age-verification/status`.
  - **Tests:** Regional rule matrix unit tests; age gate interceptor tests.

### Epic E3: Creator Onboarding, KYC, Performers (2257) & Tax
- [x] **E3.1 Creator Application & KYC Onboarding**
  - **Files:** `apps/api/src/creator/*`, `apps/api/src/webhooks/kyc-webhook.controller.ts`
  - **Tasks:** Creator profile creation (`status=draft`); KYC vendor session creation; KYC webhook processor; auto-approval vs admin review routing (Story E3-1).
  - **Endpoints:** `POST /creator/apply`, `POST /creator/kyc/session`, `GET /creator/status`, `PUT /creator/tax-profile`.
  - **Tests:** KYC webhook handling and state machine transition tests.
- [x] **E3.2 Co-Performer Verification & 18 U.S.C. §2257 Compliance**
  - **Files:** `apps/api/src/performers/*`, `apps/api/src/pii/*`
  - **Tasks:** Co-performer record management, KYC invite links for non-account holders, signed release document storage, encrypted PII store.
  - **Endpoints:** `POST /creator/performers`, `POST /creator/performers/:id/kyc-invite`, `GET /creator/performers`.
  - **Tests:** Performer invitation and verification flow tests.

### Epic E4: Media Upload & Processing Pipeline
- [x] **E4.1 S3 Uploads & Direct Presigned URLs**
  - **Files:** `apps/api/src/media/*`, `apps/worker/src/processors/media.processor.ts`
  - **Tasks:** S3 multipart presigned upload URLs (15m TTL); mime type magic-byte inspection; EXIF/GPS metadata stripping; variant generator (320, 640, 1280, 2048 px WebP/AVIF).
  - **Endpoints:** `POST /media/uploads`, `POST /media/:id/complete`.
  - **Tests:** Presigned URL generation and completion validator tests.
- [x] **E4.2 Video Transcoding & Adaptive HLS Pipeline**
  - **Files:** `apps/worker/src/transcoding/*`, `apps/api/src/media/playback.controller.ts`
  - **Tasks:** Multi-bitrate HLS transcoding (360p, 720p, 1080p) via FFmpeg worker; AES-128 key generation; thumbnail and blurred preview generation (Story E4-2); signed playback URLs.
  - **Endpoints:** `GET /media/:id/playback`.
  - **Tests:** Transcoding pipeline integration tests with test video clips.

---

## Sprint S6–S7 (Weeks 11–14): Moderation, Profiles, Posts & Vault (E5, E6, E11)

### Epic E5: Moderation Pipeline & Admin Console
- [x] **E5.1 Pre-Publication Moderation Engine**
  - **Files:** `apps/worker/src/moderation/*`, `apps/api/src/moderation/*`, `apps/api/src/moderation/admin-moderation.controller.ts`
  - **Tasks:** SHA-256 and perceptual hash (pHash) computation; known-CSAM hash matching (Story E5-1); AI classifier integration; face detection vs verified performers check (Story E5-4); priority queue (P0, P1, P2) routing.
  - **Tests:** Safe test hash matching, auto-quarantine, and reviewer routing tests.
- [x] **E5.2 Admin Console & Moderator Queue App**
  - **Files:** `apps/admin/src/app/moderation/page.tsx`
  - **Tasks:** Side-by-side media and performer review UI; blur-by-default, grayscale toggle, timed viewing; action buttons (approve, remove, suspend, ban, freeze payout) with audit logging.
  - **Tests:** Admin review action tests with audit log verification.

### Epic E6: Profiles, Posts, Feed & Engagement
- [x] **E6.1 Creator Profile & Follows**
  - **Files:** `apps/api/src/creator/*`, `apps/web/src/app/[handle]/page.tsx`
  - **Tasks:** Public profile management; bio, avatar, banner, category tags, geo-blocking; follow/unfollow functionality.
  - **Endpoints:** `GET /creators/:handle`, `PATCH /creator/profile`, `POST/DELETE /creators/:id/follow`.
  - **Tests:** Profile retrieval (hiding locked media for unentitled users) tests.
- [x] **E6.2 Posts, Feed & Content Visibility Engine**
  - **Files:** `apps/api/src/posts/*`, `apps/web/src/app/(main)/feed/page.tsx`, `apps/web/src/components/PostComposer.tsx`, `apps/web/src/components/PostCard.tsx`
  - **Tasks:** Post creation (draft, scheduled, published); visibility rules (`public`, `subscribers`, `ppv`, `tier`); scheduled post publisher worker; feed generator; likes, comments, bookmarks.
  - **Endpoints:** `POST/PATCH/DELETE /posts`, `GET /creators/:id/posts`, `GET /feed`, `POST/DELETE /posts/:id/like`, `GET/POST /posts/:id/comments`, `POST/DELETE /posts/:id/bookmark`.
  - **Tests:** Post access authorization tests (verifying non-subscribers only see blurred previews).

### Epic E11: Creator Media Vault
- [x] **E11.1 Media Vault Organization**
  - **Files:** `apps/api/src/vault/*`, `apps/web/src/app/(creator)/vault/page.tsx`
  - **Tasks:** Folders hierarchy, tagging, media search, asset reuse across posts and DMs, sales statistics per vault item.
  - **Endpoints:** `GET/POST /vault/folders`, `GET /vault/items`, `PATCH /vault/items/:id`.
  - **Tests:** Vault folder CRUD and tagging unit tests.

---

## Sprint S8–S9 (Weeks 15–18): Payments, Ledger, Subscriptions & PPV (E7, E8, E9)

### Epic E7: Payments Abstraction, Ledger & Fan Wallet
- [x] **E7.1 DB-Enforced Double-Entry Ledger & Accounts**
  - **Files:** `packages/db/prisma/migrations/*_ledger_trigger.sql`, `apps/api/src/ledger/*`
  - **Tasks:** PostgreSQL deferred constraint trigger verifying `SUM(amount_cents) = 0` per transaction (Story E7-1); balance materialization service for creator and fan wallets.
  - **Tests:** Property-based tests with 10k random postings verifying zero-sum enforcement.
- [x] **E7.2 Payment Processor Abstraction & Idempotency**
  - **Files:** `apps/api/src/payments/providers/*`, `apps/api/src/payments/payments.service.ts`, `apps/api/src/common/middleware/idempotency.middleware.ts`
  - **Tasks:** `PaymentProvider` interface (`createCharge`, `createRecurring`, `refund`, `verifyWebhook`); CCBill / Segpay sandbox adapters; 24h idempotency key cache in Redis (Story E7-3).
  - **Endpoints:** `POST /webhooks/processor/:name`.
  - **Tests:** Processor charge routing, webhook signature validation, idempotency replay tests.
- [x] **E7.3 Fan Wallet & Spending Limits**
  - **Files:** `apps/api/src/wallet/*`
  - **Tasks:** Wallet top-up via card; balance lock (`SELECT FOR UPDATE`); user-defined daily/monthly spending caps; wallet transaction history.
  - **Endpoints:** `GET /wallet`, `POST /wallet/topups`, `GET /wallet/transactions`, `PUT /wallet/limits`.
  - **Tests:** Wallet balance deduction, concurrent top-up, and spending cap guard tests.

### Epic E8: Subscriptions, Plans & Recurring Engine
- [x] **E8.1 Subscription Plans & Promotions**
  - **Files:** `apps/api/src/subscriptions/plans.controller.ts`, `apps/api/src/subscriptions/promotions.service.ts`
  - **Tasks:** Multi-month plans (1, 3, 6, 12 mo) with discounts; promo codes and free trial generation with usage limits and expiry.
  - **Endpoints:** `GET/PUT /creator/plans`, `POST/GET /creator/promotions`.
  - **Tests:** Plan pricing math and discount code application unit tests.
- [x] **E8.2 Subscription Lifecycle & Hourly Rebill Worker**
  - **Files:** `apps/api/src/subscriptions/subscriptions.service.ts`, `apps/worker/src/processors/subscription-rebill.processor.ts`
  - **Tasks:** Subscribe flow (Flow B); entitlement provisioning; hourly rebill worker; retry schedule on payment failure (+1d, +3d, +5d) -> `past_due` -> `expired` (Story E8-2).
  - **Endpoints:** `POST /subscriptions`, `PATCH /subscriptions/:id`, `GET /me/subscriptions`.
  - **Tests:** Subscription creation, rebill retry state transitions, and entitlement revocation tests.

### Epic E9: PPV Unlocks, Bundles & Tips
- [x] **E9.1 PPV Unlocks (Post & Message)**
  - **Files:** `apps/api/src/purchases/ppv.service.ts`, `apps/api/src/entitlements/*`
  - **Tasks:** PPV purchase via wallet balance (Story E9-1) or credit card; atomic ledger split (80% creator pending, 20% platform revenue); entitlement granting; media endpoint unlock.
  - **Endpoints:** `POST /purchases` `{type: 'ppv_post' | 'ppv_message', resourceId, paymentSource}`.
  - **Tests:** PPV unlock execution (< 800 ms), balance check, and `INSUFFICIENT_FUNDS` rejection tests.
- [x] **E9.2 Content Bundles & Tips**
  - **Files:** `apps/api/src/bundles/*`, `apps/api/src/tips/*`
  - **Tasks:** Bundled content packs with limited-quantity offers; tips on posts, profiles, and messages; tip fraud velocity limits ($1–$500 per tip).
  - **Endpoints:** `POST/PATCH /creator/bundles`, `GET /creators/:id/bundles`, `POST /tips`.
  - **Tests:** Bundle purchase and tip ledger split tests.

---

## Sprint S10–S11 (Weeks 19–22): Messaging, Mass Messages, Payouts & Notifications (E10, E12, E13)

### Epic E10: Messaging & Mass Message Fan-out
- [x] **E10.1 Real-Time 1:1 Messaging & WebSocket Gateway**
  - **Files:** `apps/api/src/messaging/*`, `apps/api/src/websocket/events.gateway.ts`
  - **Tasks:** WebSocket server (`wss://api.lumora.app/v1/ws`) backed by Redis Pub/Sub; 1:1 chat threads; PPV-locked messages with blurred media; read receipts; typing indicators; chatter actions storing `sent_by_staff_id`.
  - **Endpoints:** `GET /conversations`, `GET/POST /conversations/:id/messages`, `POST /messages/:id/read`.
  - **Tests:** WebSocket message delivery, PPV message masking, and chatter attribute tests.
- [x] **E10.2 Mass Message Fan-Out Worker**
  - **Files:** `apps/worker/src/processors/mass-message.processor.ts`, `apps/api/src/messaging/mass-message.controller.ts`
  - **Tasks:** Audience segmentation (active subscribers, expired, top spenders); exclusion of blocked/muted users; batched fan-out in chunks of 1,000 (Story E10-3); rate limit enforcement (5/hour per creator).
  - **Endpoints:** `POST /creator/mass-messages`, `GET /creator/mass-messages/:id`, `GET /creator/audiences/preview`.
  - **Tests:** Batch fan-out performance test (50k simulated recipients < 10 min).

### Epic E12: Payouts & Creator Statements
- [x] **E12.1 Creator Balance Maturation & Payout Requests**
  - **Files:** `apps/worker/src/processors/balance-maturation.processor.ts`, `apps/api/src/payouts/*`
  - **Tasks:** Nightly holding period worker (7 days for new creators, 3 days after 90 days) moving funds from `pending` to `available`; payout request validation (KYC valid, tax profile present, no P0 cases, method verified ≥ 72h) (Story E12-2); manual review flag for payouts > $10k; ledger movement to `in-transit`.
  - **Endpoints:** `GET/POST /creator/payout-methods`, `GET /creator/balance`, `POST/GET /creator/payouts`.
  - **Tests:** Payout eligibility checks, ledger state transitions, and failed payout reversals.
- [x] **E12.2 Monthly Statements & Tax Exports**
  - **Files:** `apps/api/src/statements/*`
  - **Tasks:** Monthly CSV and PDF statement generator; 1099-K/1099-NEC US export data; DAC7 EU export format.
  - **Endpoints:** `GET /creator/statements.csv`.
  - **Tests:** Statement calculation and CSV export format validation tests.

### Epic E13: Notifications & Preferences
- [x] **E13.1 Multi-Channel Notification Engine**
  - **Files:** `apps/api/src/notifications/*`, `apps/worker/src/processors/notification.processor.ts`
  - **Tasks:** In-app notification feed; WebSocket `notification.created` event emission; email notification worker (MailHog/Postmark); Web Push subscription manager; user preference filters.
  - **Endpoints:** `GET /notifications`, `POST /notifications/read`, `GET/PUT /notification-prefs`, `POST /push/subscriptions`.
  - **Tests:** Notification delivery and channel preference filtering tests.

---

## Sprint S12 (Weeks 23–24): Hardening, End-to-End Testing & Closed Beta Readiness

- [x] **End-to-End Critical Flow Test Suite (Playwright & Supertest)**
  - **Files:** `tests/e2e/flow-a-creator-onboarding.spec.ts`, `tests/e2e/flow-b-fan-subscription.spec.ts`, `tests/e2e/flow-c-ppv-unlock.spec.ts`, `tests/e2e/flow-d-media-moderation.spec.ts`, `tests/e2e/flow-e-creator-payout.spec.ts`
  - **Tasks:** Automated E2E verification of all 5 critical flows in test environment.
- [x] **Security Hardening & OWASP ASVS L2 Audit**
  - **Tasks:** CSP headers, strict CORS, HSTS, PII log scrubber validation, rate-limit stress tests.
- [x] **Load Testing Scripts (k6)**
  - **Files:** `tests/load/feed-read.js`, `tests/load/purchase-burst.js`, `tests/load/websocket-chat.js`
  - **Tasks:** Validate latency SLAs: p95 API read < 300ms, purchase < 800ms.

---

## Sprint S13–S15 (Weeks 25–30): Live Streaming & Analytics (E14, E15)

### Epic E14: Live Streaming (LiveKit Integration)
- [x] **E14.1 Ticketed & Subscriber Live Streams**
  - **Files:** `apps/api/src/live/*`, `apps/web/src/app/(main)/live/[streamId]/page.tsx`
  - **Tasks:** LiveKit room creation; WHIP/RTMP ingress credentials for OBS and browser broadcasting; token minting endpoint verifying subscription or ticket entitlement (Story E14-1); subscription lapse mid-stream disconnect within 60s.
  - **Endpoints:** `POST /creator/streams`, `POST /creator/streams/:id/start`, `POST /creator/streams/:id/end`, `POST /streams/:id/join`.
  - **Tests:** Live stream token minting and entitlement guard tests.
- [x] **E14.2 Stream Tips, Chat & Real-Time Frame Moderation**
  - **Files:** `apps/api/src/live/live-chat.service.ts`, `apps/worker/src/processors/stream-moderation.processor.ts`
  - **Tasks:** Live chat with tip highlights; `stream.tip` real-time alert broadcasts; tip goal progress tracking; periodic frame sampling (every 30s) to classifier with auto-kill on P0 violation; LiveKit Egress recording saved to vault.
  - **Tests:** Tip broadcast latency (< 2s) and stream auto-kill trigger tests.

### Epic E15: Creator Analytics & Business Dashboards
- [x] **E15.1 Analytics Service & Aggregators**
  - **Files:** `apps/api/src/analytics/*`, `apps/web/src/app/(creator)/analytics/page.tsx`
  - **Tasks:** Breakdown of earnings by source (subs, PPV, tips, messages, streams); subscriber retention and churn metrics; top fan spenders leaderboard; date range aggregation.
  - **Endpoints:** `GET /creator/analytics/summary`, `GET /creator/analytics/earnings`, `GET /creator/analytics/fans`.
  - **Tests:** Analytics calculation accuracy tests against ledger data.

---

## Sprint S16–S17 (Weeks 31–34): Discovery, Search, Referrals & Agency Accounts (E16, E17)

### Epic E16: Discovery & Safe Search
- [x] **E16.1 Search Indexing & Category Browsing**
  - **Files:** `apps/api/src/discovery/*`, `apps/web/src/app/(main)/explore/page.tsx`
  - **Tasks:** Search by creator handle/name/tags; featured creators carousel; category taxonomies; SFW public profile SEO pages.
  - **Endpoints:** `GET /search`, `GET /creators/featured`, `GET /categories`.
  - **Tests:** Trigram search query and category filter tests.

### Epic E17: Referrals, Agencies & Chatter Seats
- [x] **E17.1 Creator Referral System**
  - **Files:** `apps/api/src/referrals/*`, `apps/web/src/app/(creator)/referrals/page.tsx`
  - **Tasks:** Unique referral link generation; tracking referred creators for 12 months; auto-allocating 5% of platform fee to referrer in ledger postings.
  - **Endpoints:** `GET /creator/referrals`.
  - **Tests:** Referral ledger split posting and expiration tests.
- [x] **E17.2 Agency Management & Scoped Chatter Seats**
  - **Files:** `apps/api/src/agencies/*`, `apps/web/src/app/(agency)/agency/page.tsx`
  - **Tasks:** Multi-creator agency accounts; creator linking invitations with mutual consent; chatter role assignment with scoped inbox access; strict 403 blocking on payout/statement views for chatters (Story E17-2); agency revenue split ledger.
  - **Endpoints:** `POST /agencies`, `POST /agencies/:id/invites`, `POST /creator/agency-invites/:id/accept`, `GET /agencies/:id/creators`, `POST/DELETE /agencies/:id/members`, `GET /agencies/:id/earnings`.
  - **Tests:** Chatter permission isolation tests and agency revenue split accounting tests.

---

## Sprint S18–S20 (Weeks 35–40): Second Processor, VAT Engine & Public Launch (Phase 2 Parity)

- [x] **Dual Processor Routing & Failover**
  - Intelligent transaction routing based on BIN country, ticket size, and real-time approval rates.
- [x] **EU/Global VAT & Digital Sales Tax Calculation Engine**
  - Location agreement check (IP, BIN, billing address per EU VAT rules) and posting to `tax:{jurisdiction}` ledger accounts.
- [x] **Production Readiness & Scale Verification**
  - Final end-to-end audits, disaster recovery drill, zero critical findings sign-off.
