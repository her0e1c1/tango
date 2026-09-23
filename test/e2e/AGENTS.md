# E2E Test Instructions

- Pair each `test/e2e/<name>.spec.ts` with exactly one `docs/test/e2e/<name>.md` using the same basename.
- Keep every referenced case ID in that paired specification. Multiple tests may share an ID; a test may cover multiple IDs only within the same specification file.
- Preserve fixture IDs when moving tests. Helpers, fixtures, `AGENTS.md`, and `README.md` are outside the file-pairing contract.

- Treat `docs/test/e2e/**` as the single source of truth for E2E test cases.
- Playwright tests under `test/e2e/**` must cover every test case documented under `docs/test/e2e/**`.
- Each Playwright test title must start with its corresponding `docs/test/e2e` test case ID followed by a space.
- Follow the specification-file prefix and sequential numbering in `docs/test/e2e/AGENTS.md`; reuse the documented ID instead of allocating a separate sequence in Playwright files.
- Every documented case without `[TODO]` must have at least one active test. Multiple tests may share an ID, and a test may name multiple documented IDs; keep the primary fixture ID first in its title.
- Keep `[TODO]` cases in the specification without empty or skipped tests. If all cases are pending, retain the paired `.spec.ts` as a module with a TODO comment pointing to its specification.
- Run `npm run lint:test-specs` to check declared specification coverage without executing test runners.
- Do not add E2E test cases that are not documented under `docs/test/e2e/**`; remove existing undocumented E2E test cases.
- When adding a regression test, first add or update the corresponding test case under `docs/test/e2e/**`, then add the Playwright test.
- When a test case under `docs/test/e2e/**` is changed or removed, update or remove the corresponding Playwright test in the same change.
- Fixtures, helpers, type declarations, and other supporting code are not required to map one-to-one to documented test cases.
