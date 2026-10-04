# ADR 0010: Live Streaming Architecture & Creator Business Analytics

## Status
Accepted

## Date
2026-10-03

## Context
Lumora requires two complementary features to maximize creator monetization, viewer engagement, and operational business intelligence:
1. **Epic E14 — Live Streaming**: Live interactive broadcasting supporting multiple access models (`subscribers`, `ticketed`, `free_followers`), sub-second glass-to-glass latency, in-stream chat, dynamic tip goals, and real-time live tipping.
2. **Epic E15 — Creator Business Analytics**: Granular business intelligence dashboards exposing gross merchandise value (GMV), net earnings, platform commissions, subscriber cohort churn/retention metrics, revenue breakdown (subscriptions, PPV posts, tips, messages, stream gifts), and top fan spenders leaderboard.
3. **Safety & Regulatory Compliance (18 U.S.C. §2257 / §2258A)**: Live broadcasts must be subject to automated real-time compliance checks (frame sampling) with automated emergency kill switches (P0 violation auto-terminate and creator suspension) in addition to recording retention.

## Decisions

### 1. LiveKit SFU & Cryptographic Token Minting
- **Architecture**: WebRTC Selective Forwarding Unit (SFU) powered by LiveKit for sub-500ms real-time interaction.
- **Ingress Options**: WebRTC (browser publisher), WHIP (OBS / external software), and RTMP ingest.
- **Cryptographic Access Minting**:
  - The API service generates signed LiveKit Access Tokens (`HS256` JWTs) using standard Node.js cryptographic primitives (`crypto.createHmac`), embedding room permissions (`roomJoin`, `canPublish`, `canSubscribe`, `canPublishData`).
  - Tokens have a finite time-to-live (TTL = 2 hours) and are issued only after strict backend entitlement verification.

### 2. Multi-Tier Stream Entitlement Matrix
The platform enforces three distinct access modes:
- `free_followers`: Open to any authenticated user with verified age assurance.
- `subscribers`: Requires an active, non-expired subscription record with the broadcasting creator.
- `ticketed`: Requires a paid entitlement record (`resourceType: 'stream'`, `resourceId: stream.id`) purchased via wallet or gateway.
- **Creator Owner / Co-host**: Automatically entitled with publisher permissions (`isPublisher: true`).

### 3. Real-Time Live Tipping & Ledger Invariants
- Viewers can send live gifts/tips with in-stream highlighted chat badges and animated confetti.
- Tipping executes inside a strict database transaction (`prisma.$transaction`):
  - Fan wallet balance is debited (`BigInt(tipAmount)`).
  - Creator pending balance is credited (`BigInt(netCents)` = 80%).
  - Platform commission (`feeCents` = 20%) is recorded in `Purchase` table with `type: 'stream_gift'`.
  - Zero-sum invariant ($G = F + N$) is preserved across every live tip.

### 4. Stream Moderation & Emergency P0 Kill Switch
- The background worker (`StreamModerationProcessor`) samples frames from active live streams every 30 seconds.
- Multi-signal evaluation (PhotoDNA/PDQ hash matcher, age classifier, behavioral signals):
  - **P0 Critical Violation (CSAM / Underage / Extreme Harm)**:
    1. Immediately flags stream status to `ended`.
    2. Records an emergency audit log and creates a high-priority `ModerationCase`.
    3. Suspends the creator account (`user.status = 'suspended'`).
    4. Terminates LiveKit SFU room via server API.
  - **Warning / Review Flag**: Opens urgent case in `/admin/moderation` for human moderator action.

### 5. Creator Business Analytics Engine
- **Aggregations**:
  - **Gross GMV & Net Earnings**: Aggregated from settled `Purchase` records and subscription payouts.
  - **Revenue Source Breakdown**: Partitioned by `subscription`, `post_unlock`, `message_unlock`, `tip`, and `stream_gift`.
  - **Time Series**: 30-day, 90-day, and all-time daily buckets for revenue and subscriber counts.
  - **Top Fan Spenders**: Ranked by cumulative gross spend, providing creators actionable VIP fan data without leaking PII.

## Consequences
- Low-latency live video streaming with seamless monetization.
- Real-time automated safety compliance protects against illicit content broadcasts.
- Creators receive transparent, audit-grade business intelligence and churn analysis.
- Zero-sum financial engine guarantees platform fees and creator earnings remain perfectly balanced.
