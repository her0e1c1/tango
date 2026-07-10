# Repository Instructions

## Pull Request Creation

- Create new pull request branches from `origin/main` unless the user explicitly asks to use another base.
- Refresh `origin/main` before creating the branch.
- Stage only files that clearly belong to the current request. Do not use `git add .`.
- After committing and before pushing, rebase the branch onto `origin/main`.
- Before creating a pull request, verify all of the following:
  - `git status --short --branch` shows a clean working tree.
  - `git log --oneline origin/main..HEAD` contains only commits for the current request.
  - `git diff --name-only origin/main...HEAD` contains only files for the current request.
  - Required verification commands for the change have passed.
- If unrelated commits or files are present, stop and recreate the branch from `origin/main`.
