# Web Lint Hardening Plan

## Goal
Move from permissive linting to strict typing rules without blocking delivery.

## Current Strategy
- Keep global `@typescript-eslint/no-explicit-any` disabled temporarily.
- Enforce `no-explicit-any` on a strict pilot scope first:
  - `src/lib/api.ts`
  - `src/i18n/request.ts`
  - `src/components/ui/input.tsx`
  - `src/components/ui/select.tsx`
  - `src/components/ui/textarea.tsx`
- Pilot command:
  - `pnpm --filter web lint:strict:pilot`
- Hooks strict command:
  - `pnpm --filter web lint:strict:hooks`
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

3. **Phase C (In progress): Dashboard Pages**
- Migrate dashboard pages module-by-module (`farms`, `parcels`, `sales`, etc.).
- Enable strict rule per folder after each module is clean.

4. **Phase D: Full Strict Mode**
- Turn on global `@typescript-eslint/no-explicit-any` as `warn`.
- Burn down remaining warnings to zero.
- Switch global rule to `error`.

## Quality Gates
- Required on each phase:
  - `pnpm --filter web lint`
  - `pnpm --filter web lint:strict:pilot` (or phase-specific strict command)
  - `pnpm --filter web lint:strict:hooks`
  - `pnpm --filter web lint:strict:dashboard`
  - `pnpm --filter web build`
  - `pnpm --filter web test:e2e`
