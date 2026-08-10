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

## Issue Labels

Every issue must have exactly one type label. Type labels are `bug`, `enhancement`, or `question`.

Issues with `bug` or `enhancement` must have at least one area label for the modified area. Available area labels are `ci`, `ui`, `test`, `dev`, `docs`, and `dependencies`.

Issues missing a type or area classification should be labeled with `needs-triage`.
