# 🌟 Lumora — Premium Creator Platform

> **An enterprise-grade, high-compliance adult creator subscription and interactive media platform built with strict legal adherence, double-entry financial ledger integrity, real-time live streaming, and ultra-low latency interactive tooling.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-red.svg)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-indigo.svg)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC-success.svg)](https://livekit.io/)

---

## 🏛️ Executive Summary & Architectural Highlights

Lumora is engineered from first principles for performance, privacy, and regulatory rigor. It achieves full functional parity with modern creator platforms while setting new industry benchmarks for compliance, security, and ledger durability.

### Core Architectural Pillars

1. **Strict 18 U.S.C. § 2257 Recordkeeping & Age Assurance**
   - Cryptographically linked primary identification, legal custodian records, and cross-verified co-performer consent contracts.
   - 2-factor geographic evidence verification with regional age-gating enforcement.
2. **Zero-Tolerance Safety & NCMEC Integration (§ 2258A)**
   - Automated PhotoDNA / PDQ perceptual hash matching on ingest.
   - P0 quarantine kill-switches with automated legal report referral payloads for law enforcement.
   - Moderator welfare features: automatic blur, grayscale mode, and mandatory shift breaks.
3. **Double-Entry Financial Ledger**
   - Strict zero-sum double-entry ledger (`@lumora/ledger`) handling wallet balances, subscriptions, pay-per-view (PPV) unlocks, tips, and payouts in integer minor units (cents).
   - Real-time balance isolation: `pending_clearing`, `available_balance`, and `rolling_reserve`.
4. **Intelligent Dual Payment Routing & Global VAT Engine**
   - Dynamic payment gateway cascade (Processor Alpha / Processor Beta) with circuit-breaker failover.
   - Compliant 2-factor EU/UK VAT and US state sales tax calculation engine.
5. **Interactive Low-Latency Live Streaming**
   - WebRTC live streaming powered by LiveKit, with real-time tipping animations, live chat moderation, viewer presence, and automated stream kill-switches.
6. **B2B Creator Agency & Chatter Management**
   - Multi-creator agency workspaces with role-based permissions (`owner`, `manager`, `chatter`), commission splits, and granular access controls.

---

## 📂 Monorepo Topology

The workspace is organized as a high-performance Turborepo monorepo:

```
lumora/
├── apps/
│   ├── web/           # Next.js 15 App Router — Fan & Creator Web Application (Port 3000)
│   ├── admin/         # Next.js 15 App Router — Trust & Safety / 2257 Moderation Portal (Port 3001)
│   ├── api/           # NestJS REST & WebSocket API Gateway (Port 4000)
│   └── worker/        # NestJS Background Worker (BullMQ / Cron rebills & moderation triage)
├── packages/
│   ├── contracts/     # Shared Zod schemas, DTOs, and TypeScript interfaces
│   ├── db/            # Prisma ORM schema, client generation, and database migrations
│   ├── ledger/        # Immutable double-entry accounting engine (100% test coverage)
│   ├── ui/            # Reusable dark-mode UI component library and styling tokens
│   └── config/        # Shared ESLint, TypeScript, and Prettier configurations
└── docs/              # Comprehensive PRDs, Tech Specs, ADRs, and implementation docs
```

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons
- **Backend API:** NestJS 11, Express, Passport JWT, WebSockets (Socket.IO)
- **Database & Cache:** PostgreSQL 16 (via Prisma ORM 6.4), Redis (via ioredis)
- **Streaming & Media:** LiveKit WebRTC, S3-compatible object storage
- **Ledger Engine:** Custom zero-sum double-entry engine (`@lumora/ledger`)
- **Testing & Tooling:** Vitest, Turborepo, pnpm

---

## 🚀 Getting Started Locally

### Prerequisites

- **Node.js:** `>= 20.0.0`
- **pnpm:** `>= 9.0.0`
- **PostgreSQL:** `>= 15`
- **Redis:** `>= 7`

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/iamvazu/lumora.git
cd lumora
pnpm install
```

### 2. Environment Configuration

Copy the example environment files:

```bash
# Core API & Worker
cp apps/api/.env.example apps/api/.env

# Web Application
cp apps/web/.env.example apps/web/.env.local

# Admin Console
cp apps/admin/.env.example apps/admin/.env.local
```

### 3. Database Setup

```bash
# Generate Prisma Client & push schema
pnpm --filter @lumora/db prisma db push

# (Optional) Seed initial data
pnpm --filter @lumora/db prisma db seed
```

### 4. Start Development Servers

```bash
pnpm dev
```

The services will be available at:
- **Web App:** [http://localhost:3000](http://localhost:3000)
- **Admin Console:** [http://localhost:3001](http://localhost:3001)
- **API Gateway:** [http://localhost:4000](http://localhost:4000)

---

## 🧪 Testing & Verification

Run the entire test suite across all packages:

```bash
# Run unit & integration tests
pnpm test

# Run typecheck across the monorepo
pnpm turbo typecheck
```

---

## 🌐 Production VPS Deployment

Lumora can be deployed to any Linux VPS (Ubuntu 22.04 / 24.04 LTS) using PM2, Docker, or systemd with Nginx reverse proxy:

```bash
# Build all apps & packages
pnpm build

# Start production processes with PM2
pm2 start ecosystem.config.js
```

---

## ⚖️ Compliance & Security Notice

Lumora implements strict technical safeguards for 18 U.S.C. § 2257, 18 U.S.C. § 2258A, GDPR, CCPA, and Payment Card Industry (PCI-DSS) regulations. Operators deploying this software are responsible for configuring legal custodians, merchant accounts, and law enforcement integrations in accordance with applicable local laws.

---

## 📄 License

Proprietary & Confidential. All rights reserved © Lumora.
