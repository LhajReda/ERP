# SLO and Error Budget Policy

## Scope
Applies to production API and web experiences for critical ERP workflows.

## Service Level Objectives
- Availability (monthly):
  - API: `99.95%`
  - Web: `99.90%`
- Latency:
  - API P95 for core endpoints: `< 300ms`
  - API P99 for core endpoints: `< 800ms`
- Reliability:
  - 5xx rate `< 0.5%` on core endpoints (rolling 1 hour).

## Core Endpoints
- `/api/v1/auth/login`
- `/api/v1/dashboard/kpis`
- `/api/v1/farms`
- `/api/v1/finance/*` (critical transactional flows)

## Error Budget (Monthly)
- API 99.95% => max downtime `~21m 54s`.
- Web 99.90% => max downtime `~43m 49s`.

## Policy
1. If monthly error budget burn > 50%:
   - pause non-critical feature releases
   - prioritize reliability and performance fixes
2. If burn > 80%:
   - release freeze except incident/security fixes
   - daily reliability review until stabilized

## Review Cadence
- Weekly ops review: incidents, burn rate, latency trends.
- Monthly leadership review: SLO adherence and corrective roadmap.
