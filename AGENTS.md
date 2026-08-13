# Repository Instructions

- Be simple.
- Before editing files, fetch `origin/main`, then create a `git worktree` at `.worktrees/$BRANCH` from it.
- Do not work directly on `main`.
- Do not commit files ignored by `.gitignore`.
- Do not add files under `docs` unless the user explicitly requests them.
- Follow `CONTRIBUTING.md` when creating GitHub issues.
- Include the related issue number in every pull request title.
- Write comments, commit messages, pull request titles, and pull request descriptions in English.
- If `gh` fails in the sandbox, rerun it outside the sandbox.
- Before finishing non-documentation changes, run `mise run check`.

## Coding Style

- Prefer clear names and small functions over comments.
- Comment only non-obvious intent, constraints, and behavior—especially concurrency, retries, migrations, and workarounds. Explain why, not what.
- Remove stale comments and commented-out code.

## Testing

- Write tests against observable behavior so they remain stable under refactoring.
- Do not write tests that depend on implementation details.
