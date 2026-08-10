# Contribution Guide

## Getting Started

1. Set up the development environment:

   ```bash
   mise run init
   ```

2. Start the local dev server:

   ```bash
   mise run dev
   ```

## Development Workflow

- Always create a dedicated branch (or git worktree) from `origin/main` for your changes.
- Do not commit directly to `main`.
- Write comments, commit messages, PR titles, and PR descriptions in English.
- Follow Conventional Commits format (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `test:`).

## Code Quality & Verification

Before submitting a Pull Request, run local verification checks:

```bash
mise run check
```

You can also run tests with:

```bash
mise run test
```

## Issue Labels

Every issue must have exactly one type label. Type labels are `bug`, `enhancement`, or `question`.

Issues with `bug` or `enhancement` must have at least one area label for the modified area. Available area labels are `ci`, `ui`, `test`, `dev`, `docs`, and `dependencies`.

Issues missing a type or area classification should be labeled with `needs-triage`.
