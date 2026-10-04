# ADR 0006: Moderation Welfare, CSAM Auto-Quarantine, and Post Visibility Engine

## Status
Accepted

## Context
Building an 18+ creator-subscription platform requires rigorous compliance:
1. **Zero-Tolerance CSAM & Illegal Material (Story E5-1):** Known hashes must trigger instant media quarantine, creator account suspension, payout freezing, P0 case creation, and automatic NCMEC filing.
2. **18 U.S.C. §2257 Performer Validation (Story E5-4):** Media containing more detected faces than attached verified performer consent forms must be gated into a mandatory human review queue (P1) before publishing.
3. **Moderator Welfare:** Human reviewers exposed to sensitive imagery must have active wellness safeguards (blur-by-default, optional grayscale, session timers with break prompts).
4. **Post Visibility & Entitlement Engine (Epic E6):** Subscriber-only and Pay-Per-View (PPV) posts must enforce encrypted, blurred previews for unentitled users while delivering signed HLS playback URLs only to authorized subscribers/buyers.
5. **Media Vault (Epic E11):** High-resolution assets should be organized into hierarchical folders, tagged, and reused across posts and direct messages without re-uploading.

## Decision
1. **Moderation Pipeline (`apps/api/src/moderation/`):**
   - Implemented `ModerationService.processMediaAutomod` with hash matching against CSAM blacklists, AI classifier simulation, and facial count vs 2257 performer record validation.
   - Public reporting endpoint (`POST /v1/reports`) routes into prioritized triage queues.
   - Admin review console (`GET /v1/admin/moderation/queue`, `POST /v1/admin/moderation/:id/action`) enforces audit logging.
2. **Moderator Welfare Controls (`apps/admin/src/app/moderation/page.tsx`):**
   - Built an interactive admin console featuring click-to-reveal blurred media previews, toggleable grayscale viewing, and automated 30-minute eye break prompts.
3. **Posts & Visibility Engine (`apps/api/src/posts/` & `apps/web/`):**
   - Implemented `PostsService` supporting `public`, `subscribers`, `ppv`, and `tier` visibility.
   - Non-subscribers receive blurred thumbnails and `playbackUrl: null`.
   - Active subscribers and purchasers receive unblurred media with signed HLS streaming keys.
   - Created `PostCard.tsx`, `PostComposer.tsx`, creator profile `/[handle]`, and personalized feed `/feed`.
4. **Media Vault (`apps/api/src/vault/` & `apps/web/src/app/(creator)/vault/`):**
   - Implemented `VaultService` with folder hierarchies (`VaultFolder`), custom tagging, search, and direct upload capabilities.

## Consequences
- **Positive:** Zero unmoderated media leakage, strict §2257 compliance, resilient content gating, and full auditability.
- **Verification:** 29 unit/integration test suites passing across `@lumora/api`, `@lumora/ledger`, and `@lumora/contracts`. Monorepo builds cleanly with zero TypeScript errors.
