# Service Restore Runbook

## Purpose
Recover API and web services safely after critical degradation or outage.

## Preconditions
- Incident declared and severity assigned.
- Responsible engineer and reviewer identified.

## Restore Sequence
1. Confirm infra dependencies:
   - PostgreSQL healthy
   - Redis healthy
   - Storage/search dependencies reachable
2. Restore API first:
   - verify `/api/v1/health`
   - verify auth login and one core module endpoint
3. Restore web:
   - verify login page load
   - verify dashboard baseline render
4. Confirm background workers/cron jobs.

## Safe Rollback Steps
1. Identify last known good image tag (`sha`).
2. Roll back API deployment to previous stable image.
3. If needed, roll back web image to previous stable image.
4. Re-validate smoke checks after rollback.

## Data Safety Rules
- Never run destructive database operations during active incident triage.
- Use forward-only migration policy in production.
- If data integrity is uncertain, switch to read-only mode for affected flows.

## Verification Checklist
- Error rate back under SLO threshold.
- P95 latency returned to normal range.
- No elevated 5xx for 15 minutes.
- On-call confirms tenant-critical flows are operational.
