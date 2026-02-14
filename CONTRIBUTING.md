# Contributing

## Branching
- Do not push feature work directly to the default branch.
- Create a branch per change:
  - `feat/<short-topic>`
  - `fix/<short-topic>`
  - `chore/<short-topic>`
- Keep pull requests focused and small enough to review quickly.

## Commits
- Use Conventional Commits:
  - `feat: ...`
  - `fix: ...`
  - `chore: ...`
  - `docs: ...`
  - `refactor: ...`
  - `test: ...`

## Pull Requests
- Open a PR against `master` (or `main` if repository default is changed).
- Required before merge:
  - CI is green.
  - No unresolved review comments.
  - Test evidence included in PR description.
- Prefer squash merge to keep history clean.

## Local Validation
Run before opening a PR:

```bash
pnpm lint
pnpm test
pnpm build
```
