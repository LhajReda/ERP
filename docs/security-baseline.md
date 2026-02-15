# Security Baseline (Enterprise)

## Objective
Provide a minimum production security baseline expected by enterprise buyers and audits.

## Runtime Hardening
- API and web containers run as non-root users.
- Reverse proxy hides server version (`server_tokens off`).
- Basic API edge rate limiting configured at nginx.

## Transport and Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options` enabled (`SAMEORIGIN` for web, `DENY` for API)
- `Referrer-Policy` enabled
- `Permissions-Policy` restricted
- `Strict-Transport-Security` enabled

## Application Security Controls
- JWT auth with guard-based route protection.
- Policy-based authorization guard on sensitive surfaces.
- Sensitive fields redacted in audit logging.
- Request correlation ID (`x-request-id`) for traceability.
- AI chat abuse guard with endpoint rate limit (`/api/v1/chat`).
- Chat history access scoped to conversation owner.

## SDLC Security Controls
- CodeQL workflow for static analysis.
- Secret scanning workflow (gitleaks).
- Dependency review workflow on pull requests.
- Trivy filesystem scan with SARIF upload to code scanning.
- Release-readiness image scan (API + Web runtime images).
- Dependabot weekly updates for npm and GitHub Actions.

## Next Hardening Milestones
1. Add image vulnerability scanning (Trivy) in CI.
2. Add CSP policy with nonce strategy for web.
3. Add WAF rules for abuse signatures.
4. Add key rotation playbook for JWT and third-party secrets.
