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

## Human review records

- Record human review immediately before the corresponding Playwright test in a `// Human review:` comment. The specification remains the source of truth for behavior; this comment records review status, not another specification or an execution result. No comment, `[ ]`, or a missing reviewer or revision means unreviewed.
- Human review means a person checked that the specification's Given / When / Then maps correctly to the test's setup, actions, and assertions, including relevant fixtures and helpers. CI success, AI review, and viewing a passing report do not establish this status. It does not claim that someone manually exercised the application.
- Set `[x]` only after that person explicitly confirms the review. Record their identity and the full commit SHA they reviewed. That commit must contain the reviewed specification, test, and supporting code; it is not the later commit that adds the record. AI may transcribe an explicit human confirmation, but must not infer or perform human sign-off.
- Keep the record scoped to exactly one case. For generated parameterized tests, identify each reviewed case ID next to the declaration; a record for one row does not approve other rows.
- Do not change a reviewed test without a justified bug fix or specification change. Never weaken assertions, change expected values, remove coverage, or delete a test merely to make CI pass. Before changing review-relevant content, record the reason in the PR or linked issue.
- Changes affecting the specification, setup, actions, assertions, fixtures, or helpers invalidate the affected cases' review. In the same change, replace their checked records with `[ ] Re-review required:` and a reason or issue link. Check callers when shared fixtures or helpers change. Prior confirmation remains in Git history; it does not approve the changed content.
- Formatting or explanatory-comment changes may retain a record only when the reviewed meaning is unchanged. If that cannot be established, require re-review. After a person reviews the new committed content, replace the pending record with their identity and the new reviewed SHA.
- Start with cases that a person actually reviews; do not bulk-mark existing tests or create a separate ledger, CI gate, or custom tooling solely for these records.

### Minimal example

The following are alternative comments before a test, not actual review records. Replace placeholders only with evidence from the person's confirmation; never copy a checked example into a test as evidence.

```ts
// Human review: [ ]
```

After explicit human confirmation of the committed content:

```ts
// Human review: [x] by <reviewer>; reviewed <full commit SHA>
```

When a justified change affects what was reviewed:

```ts
// Human review: [ ] Re-review required: <reason or issue URL>
```

For example, if an assertion's expected value changes to match an approved specification correction, explain that correction, reset the affected record in the same change, and leave it unchecked even when CI passes. A person then reviews the new specification and test at the new commit before the record can be checked again.
