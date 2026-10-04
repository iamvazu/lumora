# ADR 0012: Dual Processor Intelligent Routing, Automated Failover & Global/EU VAT Calculation Engine

## Status
Accepted

## Date
2026-10-04

## Context
High-risk payment processing and digital commerce compliance require two mission-critical pillars:
1. **Epic E18 — Dual Processor Routing & Automated Failover**:
   - High-risk payment acceptance rates fluctuate across card schemes, acquirers, and geographic zones (e.g. European card 3D Secure challenges vs US high-ticket PPVs).
   - A single payment gateway creates a single point of failure (SPOF) and elevated payment decline rates.
2. **Epic E19 — EU & Global Digital Services VAT Engine**:
   - Compliance with EU VAT Directive 2006/112/EC and international digital tax regulations requires determining tax liability through 2 non-conflicting pieces of electronic location evidence (IP address country, card BIN country, billing country).
   - Sales tax / VAT amounts must be dynamically computed and posted to dedicated `tax:{jurisdiction}` accounts, preserving zero-sum balance sheet invariants across every transaction.

## Decisions

### 1. Intelligent Dual Processor Routing Matrix
- **Supported High-Risk Gateways**: CCBill, Segpay, Epoch, and Verotel (with fully unit/integration-testable mock adapters).
- **Rule-Based Dispatch**:
  - **European / 3DS Transactions**: Routed primarily to Segpay (`mock_segpay`) for superior EU issuer approval and SCA/3DS handling, with CCBill (`mock_ccbill`) as failover.
  - **High-Ticket PPV Drops (> $100)**: Routed to CCBill (`mock_ccbill`) for optimized underwriting limits, with Segpay (`mock_segpay`) as failover.
  - **Standard Global / US Domestic**: Routed to CCBill with automated Segpay failover.
- **Circuit Breaker & Automated Failover**:
  - If a primary gateway returns a decline or transient network failure, the transaction is immediately re-attempted against the designated `failoverProcessor` without requiring user intervention.
  - Three consecutive gateway failures mark the processor unhealthy, automatically shifting traffic to backup channels until recovery.

### 2. Global / EU VAT 2-Factor Evidence Matching
- **Location Evidence Verification**:
  - Collects three independent data points: Customer IP country, Card BIN country, and Customer Billing country.
  - Matches at least two non-conflicting signals to establish conclusive consumer tax jurisdiction.
- **Dynamic Tax Tables**:
  - Supported European and global statutory digital VAT rates (e.g. DE 19%, FR 20%, GB 20%, ES 21%, IT 22%, SE 25%, CA 5%, AU 10%).
  - Tax amount is calculated: $\text{Tax} = \text{round}(\frac{\text{Amount} \times \text{Rate}}{100})$.
- **Zero-Sum Ledger Accounting Integration**:
  - Ledger transaction incorporates tax liability:
    $$\text{Fan Wallet / Card Charge} = \text{Creator Share (80\%)} + \text{Platform Fee (20\%)} + \text{Tax (to } \texttt{tax:jurisdiction}\text{)}$$
  - Perfectly balances double-entry credits and debits to zero sum.

## Consequences
- Maximized transaction approval rates across domestic and international credit cards.
- Complete regulatory compliance with EU VAT Directive and digital sales taxation rules.
- Continuous platform resilience against acquirer downtime or gateway degradation.
- Zero-sum ledger engine guarantees complete audit readiness for tax remissions.
