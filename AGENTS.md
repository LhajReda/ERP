# Repository Guidelines

## Project Structure & Module Organization
Keep the root minimal and organized by purpose as the codebase grows:
- `src/`: application code grouped by business domain (for example, `src/inventory`, `src/orders`).
- `tests/`: automated tests mirroring `src/` structure.
- `assets/`: static files such as images, fixtures, and sample data.
- `docs/`: architecture notes, API examples, and onboarding docs.
- Root config files only (for example `package.json`, `tsconfig.json`, `.env.example`).

## Build, Test, and Development Commands
This repository does not yet define a fixed toolchain. For JavaScript/TypeScript services, standardize on:
- `npm install`: install dependencies.
- `npm run dev`: run local development server with reload.
- `npm run build`: create production build artifacts.
- `npm test`: run unit/integration test suite.
- `npm run lint`: run static analysis and style checks.

If you introduce another stack, add equivalent scripts and document them in this file.

## Coding Style & Naming Conventions
- Use consistent formatting and enforce it with a formatter/linter.
- Prefer 100-character max line length.
- Naming: files `kebab-case`, variables/functions `camelCase`, classes/types `PascalCase`, constants `UPPER_SNAKE_CASE`.
- Keep modules small and cohesive; avoid cross-domain imports when possible.

## Testing Guidelines
- Name tests `*.test.*` and colocate with code or mirror under `tests/`.
- Cover happy-path, validation, and error handling for new features.
- Run `npm test` and `npm run lint` before opening a pull request.
- Aim for strong coverage on changed code (target: 80%+ for new modules).

## Commit & Pull Request Guidelines
No stable commit pattern exists yet; adopt Conventional Commits:
- `feat: add purchase order status transitions`
- `fix: handle null supplier email`
- `docs: update setup instructions`

PRs should include:
- Clear summary and scope.
- Linked issue/ticket (if available).
- Test evidence (commands run and key results).
- Screenshots for UI changes.

## Security & Configuration Tips
- Never commit secrets; use environment variables.
- Keep `.env.example` updated when adding new config.
- Validate external input at boundaries and log failures with actionable context.
