# Repository Instructions

- Be simple.
- Before editing files, fetch `origin/main`, then create a `git worktree` at `.worktrees/$BRANCH` from it.
- Do not work directly on `main`.
- Write commit messages, pull request titles, and pull request descriptions in English.
- Before finishing non-documentation changes, run `make check`.
- Follow the decisions in `docs/adr`.
- Unless explicitly directed otherwise, prefer standard settings provided by TypeScript, Vite, Biome, and similar tools over custom scripts or checks.
