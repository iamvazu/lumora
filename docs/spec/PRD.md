# Lumora — PRD & Scope of Work

**Date:** Oct 3, 2026  
**Author:** @Mayank Singhal  

---

## Summary

We will build Lumora, an 18+ creator-subscription platform that matches the reference product's feature set (subscriptions, paid DMs, live streams, content bundles, tips, referrals, agency accounts) under our own brand, design and code. MVP in about 6 months, full parity in about 10–12 months, with a team of 10–14.

**What the reference is:** Fanspicy is an OnlyFans-style platform marketed to independent creators. Its public site advertises subscriptions, private messages, live streams and bundles; a creator dashboard with earnings and payout status; privacy and content-protection controls; a referral program; agency accounts that manage multiple creators; DMCA, refund and 18+ policies; and support via a help center, Telegram bot and WhatsApp. It claims 20,000+ creators.

**"Exact replica" means functional parity, not a copy.** Their name, logo, imagery, testimonials and site copy are theirs. We match capabilities and flows, and ship original branding, UI and text. That also keeps us clear of trademark and copyright claims at launch.

**Name:** Lumora (light + aura: creators in the spotlight). Alternates if the domain or trademark is taken: Velvra, Kindrd, Afterglow, Patronly. Run a trademark search (USPTO, EUIPO, India TMR) and check .com/.app availability before committing.

---

## Goals, non-goals, success metrics

### Goals
- Let a verified adult creator go from sign-up to first paid subscriber in under 48 hours.
- Give fans one wallet for subscriptions, tips, paid messages, bundles and live-stream gifts.
- Pay creators reliably in the main markets (US, EU, UK, LATAM, India) with clear earnings reporting.
- Pass card-network and payment-processor audits for adult content from day one.

### Non-goals for v1
- Native mobile apps (ship a PWA; app stores restrict adult content).
- Crypto payouts, NFT or token features.
- Algorithmic public discovery feed of explicit content (creator search and profiles only).
- AI-generated creator personas or AI chat "as the creator".

### Success metrics (first 12 months)

| Metric | Target |
| :--- | :--- |
| Verified active creators | 2,000 |
| Paying fans | 40,000 |
| Gross merchandise value (GMV) per month | $500k |
| Creator verification approval time | < 24 h median |
| Payment approval rate | > 85% |
| Chargeback rate | < 0.65% (below Visa/Mastercard monitoring thresholds) |
| CSAM / non-consensual content reports actioned | 100% within 24 h |

---

## Users and personas

Five roles share one account system with role-based permissions:

| Role | Who | Core needs |
| :--- | :--- | :--- |
| **Creator** | Verified 18+ adult selling access to their content | Set prices, post and schedule, mass-message, go live, see earnings, get paid |
| **Fan** | Verified 18+ adult buyer | Discover creators, subscribe, unlock content, message, tip, manage spend |
| **Agency** | Company managing several creators | Multi-creator dashboard, chatter seats, revenue split reporting, audit log |
| **Chatter / assistant** | Staff acting for a creator | Scoped inbox access, no payout access, every action logged |
| **Admin / Trust & Safety** | Internal staff | Verification review, moderation queues, refunds, payouts, reporting to authorities |

*Every person who appears in creator content (co-performers) must also be verified and consent on record, even without an account.*

---

## Functional requirements

Fourteen modules; P0 = MVP, P1 = parity, P2 = post-parity.

### 1. Accounts and auth (P0)
- Email/password, Google sign-in, magic link; 2FA (TOTP) mandatory for creators and agencies.
- Age gate on landing, then age verification before any paid action or adult content view (see Trust & Safety).
- Device/session management, login alerts, account deletion and data export.

### 2. Creator onboarding and verification (P0)
- Government ID + liveness selfie via a KYC vendor; legal name, DOB, address, tax form (W-9/W-8BEN or local equivalent).
- Payout method setup; approval queue for admins; re-verification on payout-detail change.

### 3. Creator profile (P0)
- Handle, avatar, banner, bio, social links, category tags, free/paid toggle, geo-blocking by country/region.
- Public preview (blurred/teaser posts) vs subscriber view.

### 4. Content and feed (P0)
- Posts with text, images, video, audio; multi-media carousels; drafts and scheduling.
- Access levels: free, subscribers, pay-per-view (PPV) price, tier-only.
- Video transcoding to HLS, thumbnails, watermark with fan username, upload limits (e.g. 5 GB/file).
- Fan feed of subscribed creators, likes, comments (creator can disable), bookmarks.

### 5. Subscriptions (P0)
- Monthly price per creator; bundles of 3/6/12 months at a discount; free trials and promo links with expiry and caps.
- Auto-renew on/off, grace period on failed renewal, rebill retries.
- Multiple tiers (P1).

### 6. Bundles / content packs (P0)
- Group posts or vault items into a pack sold once; flexible pricing and limited-quantity offers.

### 7. Private messaging (P0)
- 1:1 chat with media, PPV-locked messages, tips in chat, read receipts.
- Mass messages to segments (all subscribers, expired, top spenders); welcome message automation.
- Creator can set paid-to-message price; block/restrict fans; keyword filters.

### 8. Media vault (P0)
- Creator's private library with folders and tags; reuse across posts, PPV and messages; per-item sales stats.

### 9. Tips and wallet (P0)
- Fan wallet top-up; tips on posts, profiles, messages, streams; spending caps set by the fan.

### 10. Live streaming (P1)
- Creator goes live from browser or OBS (RTMP/WHIP); subscriber-only or ticketed streams; tip goals and on-screen tip alerts; live chat; replay saved to vault.

### 11. Discovery (P1)
- Search by name/handle/category, featured creators, "suggested" by category; SEO-indexed safe-for-work profile pages only.

### 12. Creator dashboard and analytics (P0 basic, P1 full)
- Earnings by source (subs, PPV, tips, messages, streams), subscriber growth, churn, top fans, statements, CSV export.

### 13. Referrals (P1)
- Creator-refers-creator: referrer earns a % of the platform fee from referred creators for 12 months.
- Referral links and dashboard.

### 14. Agency accounts (P1)
- Agency links creators with creator consent; chatter seats with scoped permissions; revenue split ledger visible to both sides; full audit trail.

### Cross-Cutting Systems
- **Notifications (P0, all modules):** in-app, email, web push; per-type preferences.
- **Support (P0):** help center, ticketing (Zendesk/Freshdesk/Zoho), in-app report button on every profile, post and message.

---

## Trust, safety and compliance

This is the critical path, not a feature: Visa and Mastercard rules for adult merchants require it before a processor will onboard you. Budget roughly 25% of engineering effort here.

### Mandatory controls (all P0)
- **Creator and co-performer verification:** ID + liveness + age ≥ 18 for every person appearing in content; signed model release and consent stored per piece of content; US 18 U.S.C. §2257-style records kept and producible.
- **Fan age assurance:** age verification where law requires it (UK Online Safety Act, France, several US states, Australia); card-based or facial-age estimation elsewhere.
- **Pre-publication moderation:** every upload hashed against known-CSAM databases (PhotoDNA, NCMEC/Thorn Safer, IWF); AI classifiers for minors, violence, non-consent, prohibited content; human review queue for flagged items and new creators' first posts.
- **Reporting:** CSAM reports to NCMEC (US) and relevant national hotlines; preserve evidence; account and payout freeze.
- **Non-consensual content:** takedown request form for anyone depicted, fast-tracked; StopNCII hash matching.
- **Prohibited content policy:** published acceptable-use policy aligned with Mastercard AN 5196 / Visa adult rules.
- **Copyright:** DMCA agent registration, notice-and-takedown workflow, counter-notice, repeat-infringer policy; watermarking to trace leaks.
- **Privacy:** GDPR/UK GDPR, CCPA, India DPDP Act; DPIA; data minimisation; KYC data encrypted and access-logged; retention schedule.
- **Financial compliance:** KYC/AML on creators and agencies, sanctions screening, tax reporting (1099-K/1099-NEC, DAC7 in EU), VAT/GST collection on fan purchases.
- **Fan protection:** clear pricing, easy cancellation, refund policy, spending limits, self-exclusion.
- **Creator protection:** block lists, geo-blocking, screenshot deterrents (best effort), anti-harassment tools.

### Legal documents to draft (counsel)
Terms of Service, Creator Agreement, Agency Agreement, Privacy Policy, Cookie Policy, Acceptable Use Policy, DMCA Policy, Refund Policy, Complaints Policy, 2257 statement.

### Entity and jurisdiction
Incorporate where adult content and high-risk payments are workable (common choices: UK, Cyprus, Delaware/Wyoming LLC with EU acquirer). Do not plan to operate the explicit-content side from India: publishing obscene material is restricted under the IT Act and IPC/BNS, so get Indian counsel before choosing structure. *This is not legal advice; engage specialist adult-industry counsel early.*

---

## Payments and monetization

Lumora takes a 20% platform fee on all fan spend; creators keep 80%, matching the market standard. Stripe, PayPal and most mainstream processors prohibit adult content, so we need a high-risk adult processor.

| Revenue stream | Fan pays | Lumora fee | Notes |
| :--- | :--- | :--- | :--- |
| Subscriptions | $4.99–$49.99/mo (creator-set) | 20% | Bundles and trials allowed |
| Pay-per-view posts and messages | $3–$200 per item | 20% | Creator-set price |
| Tips | $1–$500 per tip | 20% | Daily caps for fraud control |
| Bundles / packs | Creator-set | 20% | Limited-quantity option |
| Live stream tickets and gifts | Creator-set | 20% | |
| Referral payout | — | 5% of fee paid to referrer for 12 months | Funded from platform's 20% |
| Agency | — | Agency split set between agency and creator | Platform fee unchanged |

### Payment stack
- **Card acquiring:** two adult-approved processors for redundancy (candidates: CCBill, Segpay, Epoch, Verotel, or an adult-friendly acquirer via a PSP such as Nuvei). Routing and failover between them.
- **Alternative methods:** local methods where supported (SEPA, UPI via an approved provider, Pix), and prepaid wallet top-ups.
- **Card-network registration:** register as a high-risk adult merchant (MCC 5967); pay network registration fees; meet monitoring requirements.
- **Fraud:** 3-D Secure, velocity limits, device fingerprinting, chargeback alerts (Ethoca/Verifi).
- **Ledger:** double-entry internal ledger; every fan charge split into creator balance, platform fee, tax, processor cost.
- **Payouts:** hold period (7 days new creators, then 3); minimum payout ~$20; methods: bank transfer (SWIFT/SEPA/ACH), Payoneer, Paxum, local rails; via a payout provider (e.g. Payoneer, Tipalti, Trolley).
- **Taxes:** VAT/GST engine on fan purchases (e.g. Quaderno, Avalara); creator tax forms and year-end statements.

---

## Technical architecture and stack

A modular monolith on managed cloud services gets to MVP fastest; split out media, payments and messaging into services only when load demands it. Media delivery is the largest cost line, so design for it early.

| Layer | Choice | Why |
| :--- | :--- | :--- |
| **Web app (fan + creator)** | Next.js (React, TypeScript) as a PWA | SEO for public profiles, one codebase for mobile web |
| **Admin / T&S console** | Next.js + internal component library | Moderation queues, KYC review, refunds |
| **API** | NestJS (TypeScript) or Go; REST + WebSockets | Typed contracts shared with frontend |
| **Database** | PostgreSQL (Aurora / Cloud SQL) | Relational ledger, subscriptions, ACID |
| **Cache / queues** | Redis; SQS or Kafka for events | Sessions, rate limits, fan-out of mass messages |
| **Search** | OpenSearch / Typesense | Creator discovery |
| **Media storage** | S3-compatible object store (AWS S3, Cloudflare R2, Bunny Storage) | Private buckets, signed URLs |
| **Video pipeline** | AWS MediaConvert / Mux / Bunny Stream → HLS + DRM-lite tokenization | Adaptive streaming, per-user watermark |
| **CDN** | Adult-friendly CDN (BunnyCDN, Fastly with AUP check, Cloudflare per its terms) | Confirm acceptable-use policy in writing |
| **Live streaming** | LiveKit (self-hosted) or Ant Media; RTMP/WHIP ingest | Low latency, ticketed rooms |
| **Chat** | WebSockets on the API + Postgres, or Stream/Sendbird if adult content permitted | Read receipts, paid messages |
| **Moderation** | PhotoDNA, Thorn Safer, Hive / Sightengine classifiers, human queue | CSAM and policy screening |
| **KYC / age** | Veriff, Yoti, Ondato, Persona (confirm adult-industry acceptance) | ID + liveness, age estimation |
| **Notifications** | Postmark/SES (email), Web Push, OneSignal | |
| **Observability** | OpenTelemetry, Grafana/Datadog, Sentry | |
| **Infra** | Terraform, Kubernetes or ECS, CI/CD via GitHub Actions | Reproducible environments |

**Core data model:** User, CreatorProfile, Verification, Consent/Release, Post, MediaAsset, VaultFolder, Subscription, Plan/Tier, Bundle, Purchase, Message, Conversation, LiveStream, Tip, Wallet, LedgerEntry, Payout, Referral, Agency, AgencyMember, Report, ModerationCase, AuditLog.

**Security baseline:** encryption at rest and in transit, KMS-managed keys, PII in a separate store, signed short-lived media URLs, rate limiting, WAF, OWASP ASVS L2, annual pen test, PCI DSS SAQ-A (card data stays with processor), bug bounty after launch.

---

## Scope of work: phases, team, cost

Four phases over ~12 months; payments and compliance run in parallel from week 1 because processor approval can take 2–4 months.

| Phase | Weeks | Deliverables | Gate to next phase |
| :--- | :--- | :--- | :--- |
| **0. Foundations** | 1–6 | Entity, counsel, policies drafted; processor and KYC vendor applications; brand + design system; architecture, infra, CI/CD; data model | Processor term sheet signed; design system approved |
| **1. MVP (closed beta)** | 7–24 | Auth + 2FA; creator KYC; profiles; posts + PPV; subscriptions + bundles; messaging + mass messages; vault; tips/wallet; basic dashboard; payouts; moderation pipeline + admin console; help center | Processor live; 100 beta creators verified; T&S audit passed |
| **2. Public launch + parity** | 25–40 | Live streaming; tiers; promo/trial links; full analytics; referrals; agency accounts + chatter seats; discovery/search; multi-currency; VAT engine; second processor | Chargebacks < 0.65%; uptime 99.9% for 30 days |
| **3. Scale** | 41–52+ | Native-wrapper apps where store policy allows (SFW mode), localisation, recommendation engine, advanced fraud, data warehouse, creator CRM tools | — |

### Team (peak)
- Product manager: 1
- Product designer: 1–2
- Frontend engineers: 3
- Backend engineers: 3–4
- DevOps / SRE: 1
- QA engineer: 1
- Trust & Safety lead + moderators: 1 + 3–6 (24/7 coverage after launch)
- Payments / compliance ops: 1
- Support agents: 2+

### Budget (rough, first 12 months)

| Item | India-based team | US/EU-based team |
| :--- | :--- | :--- |
| Engineering, product, design | $250k–$450k | $1.2M–$2.0M |
| Trust & Safety + support staff | $60k–$120k | $250k–$450k |
| Legal, entity, policies, 2257 setup | $40k–$100k | $40k–$100k |
| Processor setup, card-network registration, reserves | $30k–$150k | $30k–$150k |
| Infra, CDN, video, KYC, moderation APIs | $5k–$25k/month, scaling with usage | same |
| **Total year 1** | **~$0.5M–$1.0M** | **~$1.7M–$3.0M** |

*Processors often require a rolling reserve of 5–10% of volume held for 6 months; plan cash for it.*

---

## Risks and open questions

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| Processor declines or terminates account | No revenue | Two processors from launch; strict AUP enforcement; chargeback monitoring |
| CSAM or non-consensual content gets through | Criminal liability, processor loss, shutdown | Hash matching + classifiers + human review before publish; co-performer verification |
| Age-verification laws change by market | Market blocked or fined | Geo-based AV routing; geo-blocking where compliance cost is too high |
| Content leaks / piracy | Creator churn | Per-viewer watermarks, DMCA takedown service, signed URLs |
| Vendor AUP excludes adult content (CDN, KYC, chat, email) | Forced migration | Get written confirmation of adult-content acceptance before integrating |
| Creator acquisition in a crowded market | Slow GMV growth | Referral program, agency partnerships, lower fee for first 90 days |
| Copying the reference too closely | Trademark / copyright claims | Original name, brand, UI and copy |

### Open questions
- Which jurisdiction for the operating entity and which markets at launch?
- Explicit (adult) platform, or a SFW creator platform with adult as an opt-in category? This changes processors, app-store strategy and compliance cost.
- Build in-house or start from a white-label creator-platform script and customise?
- Platform fee: 20% flat, or a lower intro rate to win creators?
- Funding available for year-1 budget and processor reserves?

---

## Sources
- Fanspicy home page — reference feature set, opened 3 Oct 2026. Other figures (fees, costs, timelines) are industry estimates, not taken from the reference.
