# Repository Instructions

## Pull Requests

- Start PR branches from fresh `origin/main` unless told otherwise.
- Stage only relevant files; never use `git add .`.
- Rebase onto `origin/main` before pushing.
- Before PR creation, check `git status --short --branch`, `git log --oneline origin/main..HEAD`, and `git diff --name-only origin/main...HEAD`.
- If unrelated commits or files appear, recreate the branch from `origin/main`.
