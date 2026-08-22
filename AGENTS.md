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

## Review Workflow

- After non-documentation changes pass the required checks, delegate a final review to `reviewer`.
- Have it review the three-dot diff against `origin/main`, plus staged, unstaged, and untracked changes. Wait for the result.
- Resolve each finding or reject it with evidence. After any non-documentation fix, rerun relevant checks and the review.
- The reviewer must not edit files.

## Architecture

- Follow the current official Feature-Sliced Design guidance before repository-specific placement preferences.
- Prefer the FSD v2.1 page-first approach: keep code in the Page that consumes it until actual reuse justifies moving it to a lower layer.
- Treat the recommended `@feature-sliced/steiger-plugin` rules as architectural constraints. Resolve violations structurally instead of disabling a recommended rule unless the user explicitly requests an exception.
- Do not retain a Feature or Entity slice solely because the code is conceptually a user action or domain concept when it has only one Page consumer; prefer colocating insignificant slices with that Page.
- Move reusable cross-Page workflows to Features, reusable domain concepts and rules to Entities, and broadly reusable technical or UI primitives to Shared.

## Coding Style

- Prefer clear names and small functions; use comments to preserve intent that the code cannot express on its own.
- Add an intent comment whenever a future maintainer could understand what the code does but not why it must work that way.
- Comments are required for non-obvious constraints and invariants, especially cross-layer decisions, asynchronous ordering, concurrency, retries, migrations, and compatibility workarounds.
- Explain why a choice is necessary and what must remain true. Do not narrate syntax or restate names.
- Update nearby intent comments when behavior changes, and remove stale comments and commented-out code.

## Testing

- Write tests against observable behavior so they remain stable under refactoring.
- Do not write tests that depend on implementation details.
