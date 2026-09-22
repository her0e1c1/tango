# E2E Test Instructions

- Treat `docs/e2e/**` as the single source of truth for E2E test cases.
- Playwright tests under `test/e2e/**` must cover every test case documented under `docs/e2e/**`.
- Each Playwright test title must start with its corresponding `docs/e2e` test case ID followed by a space.
- Follow the specification-file prefix and sequential numbering in `docs/e2e/AGENTS.md`; reuse the documented ID instead of allocating a separate sequence in Playwright files.
- Every documented case must have at least one active test. Multiple tests may share an ID, and a test may name multiple documented IDs; keep the primary fixture ID first in its title.
- Run `npm run lint:test-specs` to check declared specification coverage without executing test runners.
- Do not add E2E test cases that are not documented under `docs/e2e/**`; remove existing undocumented E2E test cases.
- When adding a regression test, first add or update the corresponding test case under `docs/e2e/**`, then add the Playwright test.
- When a test case under `docs/e2e/**` is changed or removed, update or remove the corresponding Playwright test in the same change.
- Fixtures, helpers, type declarations, and other supporting code are not required to map one-to-one to documented test cases.
