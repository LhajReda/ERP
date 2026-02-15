# World-Class ERP Plan

## North Star
Build FLA7A into the most trusted agri-ERP in the market with enterprise-grade
security, reliability, compliance, and execution speed.

## Global Targets (12 months)
- Availability: API and web >= 99.95%.
- Change failure rate: < 10%.
- Mean time to recovery (MTTR): < 30 minutes.
- P95 API latency: < 300ms for core dashboard and CRUD endpoints.
- Escaped critical security defects: 0.
- Enterprise retention (12-month): >= 90%.

## Phase Plan With Acceptance Gates

### Phase 0 - Engineering Operating System (Now)
Scope:
- Branch and PR governance.
- CI/CD stability on active branches.
- Security scanning baseline.
- Repeatable gate command for quality.

Acceptance:
- PR required for default branch.
- Mandatory checks configured in GitHub branch protection.
- `pnpm gate` available and used for release candidate checks.
- Security workflow active with CodeQL and secret scanning.

Artifacts:
- `.github/workflows/*.yml`
- `CONTRIBUTING.md`
- `.github/pull_request_template.md`
- `.github/CODEOWNERS`
- `docs/branch-protection-checklist.md`

### Phase 1 - Reliability and Observability (In progress)
Scope:
- SLOs and error budgets per critical surface.
- Structured logging with request correlation IDs.
- Metrics and alerting for API, DB, queues, and web errors.
- Incident response runbooks and postmortem template.

Acceptance:
- Live dashboards for API/web health and business KPIs.
- Alert routing tested in staging.
- Incident drill executed and documented.

Required Artifacts:
- `docs/runbooks/incident-response.md`
- `docs/runbooks/service-restore.md`
- `docs/slo-error-budget.md`

### Phase 2 - Domain Depth (ERP Excellence)
Scope:
- Finance, procurement, HR/payroll, stock traceability, compliance workflows.
- Hard validation at API boundaries and audit trails for sensitive actions.
- Tenant isolation hardening and policy-based authorization completion.

Acceptance:
- Core modules fully covered by API contract tests and E2E happy/failure paths.
- Audit logs searchable and exportable.
- No high-severity authorization gaps in security review.

Required Artifacts:
- `docs/api-contracts/*.md`
- QA evidence in `docs/qa/*`

### Phase 3 - AI and Decision Layer
Scope:
- Production-grade agent orchestration with tool safety policies.
- Explainable recommendations for agronomy, finance, and risk.
- Feedback loop for model quality and ROI tracking.

Acceptance:
- Agent output quality scorecards by module.
- Human override paths validated.
- Abuse prevention and rate-limit controls proven under load.

### Phase 4 - Enterprise Scale and GTM
Scope:
- Multi-tenant enterprise onboarding flows.
- Advanced role segregation and approval chains.
- Billing and SLA-grade support operations.

Acceptance:
- First lighthouse enterprise deployments with signed SLA.
- Onboarding time < 7 days per enterprise tenant.
- Zero P1 incidents in first 30 days after rollout.

## Sequencing and Ownership
1. Platform/Governance (CI, release, security) before feature acceleration.
2. Reliability/observability before large customer onboarding.
3. Domain depth before AI automation at scale.
4. Security and QA sign-off required at each phase gate.

## Gate Command Policy
- Mandatory pre-merge:
  - `pnpm lint`
  - `pnpm test`
- Mandatory pre-release:
  - `pnpm gate`
  - `pnpm gate:web:e2e` for web-impacting releases.
