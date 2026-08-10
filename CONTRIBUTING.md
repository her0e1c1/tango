# Contribution Guide

## Development Workflow

- Refer to [README.md](README.md#development) for initial setup and running the dev server.
- Always create a dedicated branch (or git worktree) from `origin/main` for your changes.
- Do not commit directly to `main`.
- Write comments, commit messages, PR titles, and PR descriptions in English.
- Follow Conventional Commits format (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `test:`).

## Pull Request Guidelines

Before submitting a Pull Request, run the local verification task:

```bash
mise run check
```

For details on running specific test suites, see [README.md](README.md#test).

## Issue Categorization

When opening an issue, select the appropriate type and target area using the GitHub Issue templates. Unclassified issues will be marked for triage.
