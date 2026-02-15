# Branch Protection Checklist

Configure this in GitHub:

1. `Settings` -> `Branches` -> `Add branch protection rule`
2. Apply rule to default branch (`master` today, or `main` if renamed).
3. Enable:
   - Require a pull request before merging
   - Require approvals (at least 1)
   - Dismiss stale approvals when new commits are pushed
   - Require status checks to pass before merging
   - Require conversation resolution before merging
   - Include administrators
4. Add required checks:
   - `CI / Lint, Type-check & Test`
   - `PR Title / Conventional PR title`
   - `Security / CodeQL Scan`
   - `Security / Secret Scan`
   - `Security / Trivy Filesystem Scan`
   - `Release Readiness / Build and Scan Runtime Images`
5. Disable direct pushes to the protected branch.
