# ADR 0001: Monorepo Structure and Tooling

## Status
Accepted

## Context
Lumora consists of multiple independent applications (Fan/Creator PWA, Admin & Trust/Safety Console, NestJS REST/WebSocket API, Background Worker, Media Lambdas) that share core domain logic, contracts, database models, and design system components.

## Decision
We adopted a Turborepo monorepo managed by `pnpm`:
- `apps/web`: Next.js 15 App Router for the consumer fan + creator mobile-first PWA.
- `apps/admin`: Next.js application for internal Trust & Safety and operations queues.
- `apps/api`: NestJS REST `/v1` and WebSocket gateway.
- `apps/worker`: Standalone NestJS worker consuming BullMQ queues for media processing, mass message fan-out, and payouts.
- `packages/db`: Prisma 6 schema and client definitions for PostgreSQL 16.
- `packages/contracts`: Zod schemas, Problem Details error types (RFC 9457), and OpenAPI generator.
- `packages/ledger`: Pure TypeScript double-entry accounting engine with 100% test coverage.
- `packages/ui`: Design system with dark-mode aesthetic, Radix UI primitives, and Tailwind CSS.
- `packages/config`: Shared ESLint, TypeScript, and Prettier configurations.

## Consequences
- Shared TypeScript contracts and validation schemas ensure 100% type parity between client and server.
- Turborepo pipelines provide fast, cached incremental builds across packages and apps.
