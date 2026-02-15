# Incident Response Runbook

## Purpose
Standardize how the team detects, escalates, mitigates, and closes production incidents.

## Severity
- `SEV-1`: Full outage, data-loss risk, or critical security breach.
- `SEV-2`: Major degradation of core business flows.
- `SEV-3`: Partial degradation with available workaround.

## Response Targets
- `SEV-1`: Acknowledge in <= 5 min, mitigation in <= 30 min.
- `SEV-2`: Acknowledge in <= 10 min, mitigation in <= 60 min.
- `SEV-3`: Acknowledge in <= 30 min, mitigation same business day.

## Incident Commander Flow
1. Declare incident in team channel and assign incident commander.
2. Record:
   - start time (UTC)
   - impacted services and tenant scope
   - current symptom
3. Freeze non-essential deployments until mitigation is stable.
4. Open tracking doc with timeline and decisions.
5. Execute technical mitigation with smallest safe change.
6. Communicate updates every 15 minutes for SEV-1/2.
7. Close incident only after stability confirmation window.

## Technical Checklist
- Validate API health endpoint and error-rate spikes.
- Check DB connectivity, pool saturation, slow queries.
- Check Redis availability and queue backlogs.
- Confirm recent deployments and config changes.
- Inspect logs by `requestId` for failing traces.

## Post-Incident
1. Create postmortem in <= 48h.
2. Include:
   - root cause
   - contributing factors
   - what worked / what failed
   - corrective actions with owners and deadlines
3. Track actions to completion in sprint board.
