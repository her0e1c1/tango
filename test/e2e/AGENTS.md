# E2E Test Instructions

- Group setup, actions, and expected-result assertions in standard `await test.step(...)` blocks named `Given: ...`, `When: ...`, and `Then: ...`. Use concise English scenario names and preserve execution order when actions and assertions repeat.
- Put precondition assertions in Given. Make fixture and helper roles clear from the surrounding steps and reuse existing step and helper boundaries. Do not add redundant wrappers, empty phases, or deep nesting.
- Return values needed by later steps and receive them through destructuring. Do not add outer mutable state, definite assignment assertions, or casts. Remove duplicate phase comments while keeping explanations of non-obvious intent and constraints.
- When only grouping existing code into steps, preserve actions, assertions, inputs, expected values, test names and case IDs, fixtures, selectors, timeouts, retries, and skip/TODO status.

- Pair `test/e2e/<name>.spec.ts` and `docs/test/e2e/<name>.md` one-to-one, using the same basename.
- Each Playwright test, including each generated parameterized test, must reference exactly one case ID defined in its paired specification. Do not share a case ID across tests or reference multiple case IDs in one test.
- Preserve fixture IDs when moving tests. Helpers, fixtures, `AGENTS.md`, and `README.md` are excluded from file pairing.

- Use `docs/test/e2e/**` as the single source of truth for E2E test cases.
- Every specification case without `[TODO]` must correspond to exactly one active Playwright test under `test/e2e/**`, establishing a one-to-one mapping between specification cases and tests.
- Begin each Playwright test name with its specification case ID followed by a space. This ID also selects the fixture.
- Order test cases as `read` then `write` (`create`, `update`, `delete`).
- Order successful scenarios before error scenarios.
- Follow `docs/test/e2e/AGENTS.md` for specification ID prefixes and number formats. Reuse the documented stable IDs regardless of specification order; do not assign separate sequential numbers in Playwright files.
- Keep `[TODO]` cases in the specification without creating empty or skipped tests. If all cases are pending, retain the paired `.spec.ts` as a module with a TODO comment pointing to the specification.
- Run `npm run lint:test-specs` to check declared specification coverage without running the test runner. This check does not enforce the one-to-one mapping; verify it during review.
- Do not add E2E test cases absent from `docs/test/e2e/**`. Remove existing undocumented E2E test cases.
- Before adding a regression test, add or update the corresponding case in `docs/test/e2e/**`, then add the Playwright test.
- When changing or deleting a case in `docs/test/e2e/**`, update or delete its Playwright test in the same change.
- Supporting code such as fixtures, helpers, and type declarations does not need a one-to-one mapping to specification cases.
