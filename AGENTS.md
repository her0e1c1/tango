# Repository Instructions

- Be simple.
- Do not suppress Knip findings with `@public`, `@ignore`, `ignore*` settings, or exclusion patterns. Remove unused code or dependencies, and configure actual application and tooling entry points instead.
- Before editing, fetch `origin/main` and create a `git worktree` at `.worktrees/$BRANCH` from it. Never work directly on `main`.
- Do not commit files ignored by `.gitignore`.
- Do not add files under `docs` unless the user explicitly requests them.
- Follow `CONTRIBUTING.md` when creating GitHub issues.
- Include the related issue number in every pull request title, or `No issue` when none exists.
- Write comments, commit messages, pull request titles, and pull request descriptions in English.
- If `gh` fails in the sandbox, rerun it outside the sandbox.
- Before finishing non-documentation changes, run `mise run check`.
- Always commit and push worktree changes, then create a pull request.

## Mandatory Review Gate

Every task that changes repository files must complete this workflow:

1. Delegate a review to the custom `reviewer` subagent and wait for the result. Self-review is not a substitute.
2. Fix all P0 findings; P1 and P2 fixes are optional. Re-review any fixes, with at most three review rounds in total.
3. Stop when the latest changes have been reviewed with no P0 findings, or the three-round limit is reached. Report unresolved findings and unreviewed changes; unresolved P0 findings or unreviewed changes mean validation is incomplete.

## Architecture

- Follow the current official Feature-Sliced Design layer boundaries, slice isolation, and public API rules. Repository-specific placement rules must stay within those boundaries.
- Prefer FSD v2.1 page-first for screen-specific code, except for the API placement policy below. Move other code to lower layers only when actual reuse justifies it.
- Treat recommended `@feature-sliced/steiger-plugin` rules as constraints. Resolve violations structurally; disable a recommended rule only when the user explicitly requests an exception.
- Move reusable cross-Page workflows to Features, reusable domain concepts, rules, and visual representations to Entities, and broadly reusable technical or UI primitives to Shared.
- UI components define their own props instead of reusing model return types. Keep locale-dependent formatting, such as dates and numbers, in UI rather than model hooks.
- When a Page needs route parameters, import and call `useParams()` in the Page component under `ui/`, and pass the required parameters to the Page model hook.

### API placement

- Do not create `api/` directories anywhere under `src/pages`. FSD permits Page API segments; this prohibition is a repository-specific placement policy.
- Keep domain-specific request functions, Firestore reads, writes, and subscriptions, and persistence parsing and mapping in the owning `entities/<entity>/api/`, regardless of HTTP method or the number of consuming Pages.
- Keep domain-agnostic HTTP/SDK clients and generic transport or storage helpers in Shared, such as `shared/api`. Shared must not depend on Entities.
- Page model code consumes Entity operations through the slice public API (`@/entities/<entity>`). Do not bypass this boundary with deep imports or hide domain data access in Page `model/`, `lib/`, or `ui/`.
- Keep Page-specific workflow sequencing in `model/actions/`, and Page-specific state, navigation, and notifications in the Page model layer. Move workflows to Features only for actual cross-Page reuse; do not move these concerns into Entities merely to remove a Page API segment.
- Preserve Entity slice isolation and dependency direction. Do not import Pages or Features from Entities, orchestrate unrelated Entity slices there, or create Page-named Entity slices or a generic `entities/api` bucket.

### Model organization

- Across Pages, Features, and Entities, put state-changing operations and workflows in `model/actions/`, and read-only getters, selectors, and derived data in `model/queries/`. Queries must not update state or initiate persistence.
- Give each action its own file and ordinary named function. Keep implementations out of actions objects, action factories, and hooks.
- Provide a Page model hook in `model/` to supply Page and Container values and bound action callbacks as named properties, not an actions object. Limit it to wiring stores, state hooks, queries, actions, and simple effects; no business rules, validation, derived-data calculations, state transitions, or async workflow sequencing. Awaiting an action result solely to perform guarded navigation is allowed.
- State hooks may own state, refs, forms, and resource cleanup, but must not return business-action callbacks. Page models connect them to actions.
- Keep purpose-named operation trigger hooks in `model/actions/`. Page models may connect entry, cleanup, and existing actions through simple effects without a dedicated lifecycle hook.
- Pass only each action's required inputs and state handles, not an entire model. Preserve shared locks, save ordering, retry identities, and pending-work lifetimes when splitting operations.
- Limit Entity stores to state, initialization, and persistence middleware. Keep schemas, rules, and defaults pure, and persistence implementations in `api/`.
- Export reusable operations through the slice public API. Within a slice, import modules directly; do not add internal barrel files.

### Forms

- Form values and schemas contain only fields editable or selectable in that form. Defaults, saved values, and programmatic updates to those fields are allowed.
- Keep non-editable context and system-managed metadata outside the form; combine them with validated values in submit actions.
- Use React Hook Form APIs directly instead of wrapping existing capabilities. Connect `handleSubmit` to actions accepting validated values, not DOM events or `handleSubmit` itself.
- Keep application-specific submission rules, concurrency control, and async lifetime management in model actions, not UI hooks.

### Toasts

- Pages and Features use `showToast` for transient operation results. `shared/ui/toast` owns their duration and dismissal; success and error notifications dismiss automatically after the shared default duration.
- Do not retain toast IDs solely for later dismissal, add page-specific timers, or dismiss on retry, navigation, or unmount.
- Preserve guards against stale async notifications. Persistent warnings and progress displays are outside this rule.

## Coding Style

- Prefer clear names and small functions. Add comments for non-obvious intent, constraints, and invariants; explain why, not what the code does.
- Keep comments consistent with behavior. Remove stale comments and commented-out code.

## Testing

- E2E case IDs use the uppercase `docs/test/e2e` specification filename without `.md` as their prefix, followed by a zero-padded sequence starting at `01` in document order without gaps (for example, `CARD-VIEW-01`). Renumber all indexes, anchors, Playwright titles, and unit/integration references together.

- Do not add tests for non-application code. Assert observable behavior through the tested level's public boundary, not implementation details.
- Design production interfaces for production requirements. Do not add or change parameters, dependency objects, callbacks, factories, optional overrides, or exports solely for tests or mocks; use test-side module mocks or spies instead.

### Firestore Integration Tests

- Use `docs/test/integration/firestore` for persistence, subscription, and security-rule contracts tested under `test/integration/firestore`. Keep browser-facing user flows in `docs/test/e2e`; related E2E links are optional, not required IDs for Firestore-specific contracts.
- Follow the E2E specification format in Japanese: purpose, case index table, explicit ID anchors and headings, category, and Given / When / Then. Link each specification to its test file and include an identifiable test title for every case. Describe setup inline; do not add fixture files.
- Each `it` or `it.each` title must include its `FIRESTORE-<UPPERCASE-SPEC-FILENAME>-<NN>` ID. Start at `01` in each file, follow document order without gaps, and update indexes, anchors, and titles together. Parameterized rows may share an ID when their inputs and expected results are documented.
- Update the corresponding specification when adding or changing a test, including regressions. Do not mock the Firestore boundary being verified. Distinguish Adapter validation from Rules authorization and record unverified expectations separately instead of changing behavior during documentation work.

### Storybook Integration Tests

- Use `docs/test/integration/storybook` for public UI contracts verified by `play` functions in `src/**/*.stories.tsx`. Keep end-to-end user flows in `docs/test/e2e` and persistence, subscriptions, and Rules in `docs/test/integration/firestore`.
- Follow the Japanese E2E-style format: purpose, case index, explicit ID anchors and headings, category, and one Given / When / Then block each. Describe setup inline; do not add dedicated fixture files or duplicate stories under `test/integration`.
- Use `STORYBOOK-<UPPERCASE-SPEC-FILENAME>-<NN>` IDs starting at `01` without gaps. Map every case to its story file and named export; update indexes, anchors, and mappings together. Existing story names do not need to change solely to carry an ID. Document shared plays and parameterized story variants explicitly.
- Test observable UI behavior with real composed components and forms. Mock only boundaries outside the contract, using story-side setup and public callback spies; do not add production interfaces solely for tests.
- Update the corresponding specification when adding or changing a play, including regressions. Separate rendering-only stories, setup-only plays, and missing assertions from verified expectations; a callback notification does not prove persistence or navigation.

### Other Unit and Integration Tests

- Outside `test/integration/firestore` and Storybook `play` functions, treat `docs/test/e2e` as the only runtime behavior specification; do not introduce separate unit/integration specification documents or ID systems. Define missing behavior there before writing tests; adding new files under `docs` still requires an explicit user request.
- Each new or modified unit/integration test for runtime behavior must reference at least one existing E2E case ID in its outermost `describe` title, or its test title when there is no `describe`.
- Co-locate unit tests under `src/**/*.spec.{ts,tsx}` for deterministic rules, state transitions, validation, and module or component behavior without real external services.
- Put integration tests under `test/integration/**/*.spec.{ts,tsx}` for contracts across application modules, persistence, stores, or emulators. Do not mock the boundary being verified.
- Parameterized tests must include a representative row matching the referenced E2E Given / When / Then. Additional boundary-value or equivalence-class rows must preserve the same behavior and invariants.
- Do not derive cases or expected results solely from implementation details: branches, private functions, internal state shapes, mock call counts, or coverage gaps.
- Enforce static constraints, such as dependency direction and type correctness, with lint or typecheck rather than runtime tests; these checks do not require E2E IDs.
