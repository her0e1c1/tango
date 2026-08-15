# Repository Instructions

- Be simple.
- Before editing files, fetch `origin/main`, then create a `git worktree` at `.worktrees/$BRANCH` from it.
- Do not work directly on `main`.
- Do not commit files ignored by `.gitignore`.
- Do not add files under `docs` unless the user explicitly requests them.
- Follow `CONTRIBUTING.md` when creating GitHub issues.
- Include the related issue number in every pull request title. If there is no related issue, explicitly state `No issue` in the title.
- Write comments, commit messages, pull request titles, and pull request descriptions in English.
- If `gh` fails in the sandbox, rerun it outside the sandbox.
- Before finishing non-documentation changes, run `mise run check`.

## Coding Style

- Prefer clear names and small functions; use comments to preserve intent that the code cannot express on its own.
- Add an intent comment whenever a future maintainer could understand what the code does but not why it must work that way.
- Comments are required for non-obvious constraints and invariants, especially cross-layer decisions, asynchronous ordering, concurrency, retries, migrations, and compatibility workarounds.
- Explain why a choice is necessary and what must remain true. Do not narrate syntax or restate names.
- Update nearby intent comments when behavior changes, and remove stale comments and commented-out code.

## Testing

- Write tests against observable behavior so they remain stable under refactoring.
- Do not write tests that depend on implementation details.
