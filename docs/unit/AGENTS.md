# Entity Unit Test Documentation Instructions

## Scope

- Except for this `AGENTS.md`, every `docs/unit/*.md` file is a Japanese unit test specification for `src/entities/**/*.spec.{ts,tsx}`.
- Group specifications by Entity and split distinct behaviors when useful, such as Card data rules and Card presentation. Keep rules and shared execution assumptions here; do not add a README, fixture files, or a separate case registry.
- Specify observable inputs, outputs, validation failures, state transitions, rendered content, and public callback or adapter boundaries. Do not prescribe private helpers, store layouts, mock call counts, or library algorithms.
- Keep actual Firestore persistence, subscription delivery, and Rules in `docs/integration/firestore`, Storybook plays in `docs/integration/storybook`, and browser flows in `docs/e2e`.
- A mocked SDK or persistence boundary verifies application behavior around that boundary, not real authentication, storage durability, authorization, delivery, or atomicity.

## Case format and correspondence

- Include a purpose, a case index table, explicit anchors and headings, a category, and one Given / When / Then block per case. Describe setup and representative inputs inline.
- Use `UNIT-<UPPERCASE-SPEC-FILENAME>-<NN>` IDs, numbered from `01` without gaps in document order. Use lowercase IDs for explicit anchors. Update indexes, anchors, and references together.
- Link each case to its existing test file and identifiable test title. Preserve parameter placeholders such as `%s` and `$status`; qualify duplicate titles with their `describe` name.
- Require the tests to cover the specified behavior, not a strict one-to-one relationship between case IDs and test functions. Multiple tests may cover one case, and an existing test may cover several separately documented behaviors. Document parameterized inputs and expectations together.
- Existing test titles do not need to be renamed merely to add Unit IDs. E2E IDs may remain as optional context; they are not required for Entity unit tests.
- Update the corresponding specification when adding or changing an Entity unit test, including regressions. Separate proposed or unasserted expectations from mapped test cases rather than presenting them as verified behavior.
- A mapping identifies assertions in the test source; it does not report that the test was executed or passed. Record execution results in the pull request.

## Categories and isolation

- `read`: validation, calculation, selection, data mapping, state reads, and component rendering or intent callbacks without changing Entity state or requesting persistence.
- `write`: Entity state changes, persistence or authentication requests, and subscription handling, even when the external boundary is mocked or validation rejects the operation.
- Arrange fresh state, storage, mocks, and time per test. Restore hooks, timers, spies, and subscriptions after use. Do not depend on another test's data or execution order.
- Use production inputs and existing test-side mocks or helpers. Do not add production interfaces, exports, or abstractions solely for documentation or test setup.

## Checks

- `npm run lint:markdown`: validate Markdown using the repository configuration.
- `npm run test:unit -- src/entities`: execute the Entity unit tests.
- Check that case IDs, anchors, file links, and named test mappings remain consistent. Do not add a dedicated linter or enforce one-to-one test counts solely for these specifications.
