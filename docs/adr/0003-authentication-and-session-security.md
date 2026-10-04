# ADR 0003: Authentication, Session Management and 2FA Enforcement

## Status
Accepted

## Context
As an 18+ platform processing direct payments and hosting creator media, account compromise poses severe financial and safety risks. Strong authentication, session tracking, and creator 2FA enforcement are mandatory.

## Decision
1. **Password Hashing:** Passwords are encrypted using Argon2id with OWASP-recommended parameters (memory cost 64MB, 3 iterations).
2. **Token Strategy:** Short-lived JWT access tokens (15-minute validity, held in client memory) paired with rotating refresh tokens (30-day validity, stored in `httpOnly`, `Secure`, `SameSite=Lax` cookies).
3. **Two-Factor Authentication:** TOTP (RFC 6238) with AES-encrypted secret storage and 6 backup codes. Mandatory for all creator and agency roles before publishing or receiving payouts.
4. **Session Tracking:** Every login issues a UUIDv7 session recorded in PostgreSQL with IP, device, and user agent. Users can view active sessions and remotely revoke unauthorized access.
5. **Errors & Idempotency:** RFC 9457 Problem Details (`application/problem+json`) for standardized error codes and 24-hour idempotency caching on financial POST operations.

## Consequences
- XSS token theft is mitigated by memory-only access tokens and httpOnly refresh cookies.
- Account hijacking risk is minimized through mandatory 2FA on revenue-generating accounts.
