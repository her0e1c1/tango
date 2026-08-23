# E2E Test Instructions

- Treat `docs/e2e/**` as the single source of truth for E2E test cases.
- Playwright tests under `test/e2e/**` must cover every test case documented under `docs/e2e/**`.
- Each Playwright test must include the corresponding `docs/e2e` test case ID in its test name.
- Do not add E2E test cases that are not documented under `docs/e2e/**`; remove existing undocumented E2E test cases.
- When adding a regression test, first add or update the corresponding test case under `docs/e2e/**`, then add the Playwright test.
- When a test case under `docs/e2e/**` is changed or removed, update or remove the corresponding Playwright test in the same change.
- Fixtures, helpers, type declarations, and other supporting code are not required to map one-to-one to documented test cases.
