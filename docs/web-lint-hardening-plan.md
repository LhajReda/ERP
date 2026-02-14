# Web Lint Hardening Plan

## Goal
Move from permissive linting to strict typing rules without blocking delivery.

## Current Strategy
- Global `@typescript-eslint/no-explicit-any` is now enforced as `error` for all web files.
- Keep phase-specific strict commands as fast regression checks for key surfaces:
- Pilot command:
  - `pnpm --filter web lint:strict:pilot`
- Hooks strict command:
  - `pnpm --filter web lint:strict:hooks`
- Auth/Layout strict command:
  - `pnpm --filter web lint:strict:auth-layout`
- Dashboard strict command:
  - `pnpm --filter web lint:strict:dashboard`

## Phase Plan
1. **Phase A (Completed now): Foundation**
- Non-interactive ESLint setup.
- Fix hook-order issues and remove blocking lint errors.
- Add stable Playwright smoke coverage.

2. **Phase B (Completed): Data & API Layer**
- Remove `any` from `src/hooks/use-api.ts`.
- Add lightweight response/request types for shared API shapes.
- Enforce `no-explicit-any` on `src/hooks/**/*.ts`.

3. **Phase C (Completed): Dashboard Pages**
- Migrate dashboard pages module-by-module (`farms`, `parcels`, `sales`, etc.).
- Enable strict rule per folder after each module is clean.

4. **Phase D (Completed): Full Strict Mode**
- Expanded strict scope around shell/auth surfaces (`src/app/[locale]/(auth)/**`, `src/components/layout/header.tsx`).
- Turned on global `@typescript-eslint/no-explicit-any` as `error`.
- Burned down remaining warnings to zero in `apps/web/src`.

## Quality Gates
- Required on each phase:
  - `pnpm --filter web lint`
  - `pnpm --filter web lint:strict:pilot` (or phase-specific strict command)
  - `pnpm --filter web lint:strict:hooks`
  - `pnpm --filter web lint:strict:auth-layout`
  - `pnpm --filter web lint:strict:dashboard`
  - `pnpm --filter web build`
  - `pnpm --filter web test:e2e`
