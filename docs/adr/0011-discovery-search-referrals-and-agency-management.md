# ADR 0011: Discovery, Safe Search, Creator Referrals & B2B Agency Management

## Status
Accepted

## Date
2026-10-04

## Context
As Lumora expands from core creator monetization to network growth and enterprise representation, two key capabilities are required:
1. **Epic E16 — Discovery & Safe Search**: SFW creator discovery, category taxonomies (`cosplay`, `fitness`, `art`, `music`, `lifestyle`, `gaming`), featured/trending spotlights, and public SEO profile routes.
2. **Epic E17 — Referrals, Agencies & Chatter Seats**:
   - Creator referral system: 5% of gross platform fee commission for 12 months from signup.
   - B2B Multi-creator Agency accounts with explicit mutual creator consent (`creatorConsentedAt`).
   - Scoped chatter seats: Customer support and chat operator access with strict 403 Forbidden blocking on financial views, payouts, statements, and tax forms (Story E17-2).

## Decisions

### 1. Discovery Indexing & SFW Public Browsing
- **Search Queries**: Endpoints query approved creators by `handle`, `displayName`, `bio`, and `category` with case-insensitive trigram matching.
- **Taxonomy Categories**: Curated category slugs with real-time creator count aggregation.
- **Safe Public Exposure**: Public exploration only renders verified, approved creator cards with SFW profile information.

### 2. Creator Referral Engine & 12-Month Ledger Tracking
- **Link Generation**: Creators generate unique referral links formatted as `https://lumora.app/signup?ref={handle}`.
- **Attribution & Expiry**: When a new creator registers via a referral link, a `Referral` record is created with `expiresAt = now() + 365 days` and `shareBps = 500` (5.0%).
- **Ledger Commission Split**:
  - The referrer receives 5% of gross platform fee revenue ($5.00$ on every $\$100.00$ GMV).
  - Commission earnings are automatically credited to creator available balance upon payment settlement.

### 3. B2B Multi-Creator Agency Architecture
- **Legal Entity Registration**: Agencies register with legal entity references (`legalEntityRef`) and operate as multi-creator management organizations.
- **Mutual Consent Linking**:
  - Agency initiates an invitation with a proposed revenue split (`splitBps`, e.g. 2000 bps = 20%).
  - The creator must explicitly consent in their creator dashboard (`POST /creator/agency-invites/:id/accept`) before the partnership status transitions to `active`.
- **Scoped Chatter Seats & Security Isolation (Story E17-2)**:
  - Agencies can invite team members with specific roles (`manager`, `chatter`).
  - Chatters are restricted to scoped messaging permissions (`inbox:read`, `inbox:reply`).
  - **Financial Isolation Invariant**: All requests by chatters to financial endpoints (`/agency/:id/earnings`, `/payouts`, `/creator/statements`) are intercepted and blocked with strict HTTP 403 Forbidden.

## Consequences
- Organic creator-led viral distribution through referral incentives.
- Safe, SEO-optimized creator discovery without exposure of unauthorized explicit media.
- Professional talent agencies can manage creator rosters, operate scaled chat operations safely, and receive automated commission splits without compromising sensitive financial data.
