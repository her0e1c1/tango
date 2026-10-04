# Contribution Guide

## Development Workflow

- Refer to [README.md](README.md#development) for initial setup and running the dev server.
- Develop in a task-specific worktree and branch. Reuse a suitable worktree and branch for the same task; create a new worktree from freshly fetched `origin/main` only when needed, following [AGENTS.md](AGENTS.md).
- Do not develop in shared checkouts or on `main` or `develop`; preserve unrelated work and other tasks' worktrees and branches.
- Write comments, commit messages, PR titles, and PR descriptions in English.
- Follow Conventional Commits format (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `test:`).

## Pull Request Guidelines

Before submitting a pull request with non-documentation changes, run the local verification task:

```bash
mise run check
```

For details on running specific test suites, see [README.md](README.md#test).

## Issue Categorization

When opening an issue, select the appropriate type and target area using the GitHub Issue templates. Unclassified issues will be marked for triage.
