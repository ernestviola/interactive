# Branch workflow

New feature branches MUST be created from `staging` (or an up-to-date `origin/staging`).
Feature work MUST merge back into `staging`. Only `staging` may be promoted into `main`;
feature branches and direct commits MUST NOT go directly into `main`.

Install the versioned local guards in each clone with `sh scripts/install-git-hooks.sh`.
The guards require Python 3 and permit fast-forward or two-parent merge promotions from
staging. Fetch staging before starting a feature. They apply to every non-protected local
branch, regardless of its name.

Local hooks can be disabled and do not run for GitHub web merges. Repository administrators
must additionally protect `main` and `staging`, require pull requests, and require a source-branch
check that accepts only `staging` → `main` to enforce this workflow on the server.

The included GitHub workflow provides the `staging-to-main` check. Once published, make
that check required on `main`, disallow force pushes and deletion, and disable bypasses.
The installer uses this checkout's absolute hook path so linked worktrees share the guards;
rerun it after moving this checkout (or update the hook path if removing it).
