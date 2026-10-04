# ADR 0004: Age Assurance and Regional Compliance Matrix

## Status
Accepted

## Context
Global regulations surrounding adult content platforms require distinct age assurance verification workflows depending on jurisdiction:
- United Kingdom (Online Safety Act 2023)
- France (ARCOM digital age verification mandate)
- United States (Texas HB 1181, Virginia, Utah SB 287, Louisiana HB 142)
- Rest of World: Card-based verification or facial age estimation.

## Decision
1. Maintain a centralized `RegionAgeRule` matrix in `apps/api/src/age/age.service.ts` evaluated by fan country and state.
2. For strict jurisdictions (`GB`, `FR`, `AU`, `US-TX`, `US-VA`, `US-UT`, `US-LA`), enforce government ID + liveness biometric verification before any explicit content playback or purchase.
3. Apply `AgeVerificationGuard` globally on monetized/adult content endpoints throwing RFC 9457 `AGE_VERIFICATION_REQUIRED`.
4. Capture `age_verified_at` and `age_verification_method` on `users` with an immutable verification record in `verifications`.

## Consequences
- Full regulatory compliance across evolving US state and EU/UK laws.
- Unverified users are blocked at the API layer, not just hidden in the frontend UI.
