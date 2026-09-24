# Repository Instructions

- Be simple.
- Do not suppress Knip findings with `@public`, `@ignore`, `ignore*` settings, or exclusion patterns. Remove unused code or dependencies, and configure actual application and tooling entry points instead.
- Before editing, fetch `origin/main` and create a `git worktree` at `.worktrees/$BRANCH` from it. Never work directly on `main`.
- Before creating or updating a pull request, fetch the latest base branch and rebase the working branch onto it. Verify that the PR diff contains only task-related changes, removing unrelated commits or changes before pushing.
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

- Across Pages and Features, put state-changing operations and workflows in `model/actions/`, and read-only getters, selectors, and derived data in `model/queries/`. Queries must not update state or initiate persistence.
- Give each action its own file and ordinary named function. Keep implementations out of actions objects, action factories, and hooks.
- Provide a Page model hook in `model/` to supply Page and Container values and bound action callbacks as named properties, not an actions object. Limit it to wiring stores, state hooks, queries, actions, and simple effects; no business rules, validation, derived-data calculations, state transitions, or async workflow sequencing. Awaiting an action result solely to perform guarded navigation is allowed.
- State hooks may own state, refs, forms, and resource cleanup, but must not return business-action callbacks. Page models connect them to actions.
- Keep purpose-named operation trigger hooks in `model/actions/`. Page models may connect entry, cleanup, and existing actions through simple effects without a dedicated lifecycle hook.
- Pass only each action's required inputs and state handles, not an entire model. Preserve shared locks, save ordering, retry identities, and pending-work lifetimes when splitting operations.
- Entity `model/store.ts` owns Entity state plus synchronous store reads, updates, and thin selector hooks. Keep schemas and rules pure, and persistence implementations in `api/`.
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

- Keep specification case IDs in implementation titles and update those references when cases are moved or renumbered.
- Do not add tests for non-application code. Assert observable behavior through the tested level's public boundary, not implementation details.
- Design production interfaces for production requirements. Do not add or change parameters, dependency objects, callbacks, factories, optional overrides, or exports solely for tests or mocks; use test-side module mocks or spies instead.

### Firestore Integration Tests

- Keep persistence, subscription, and security-rule tests under `test/integration/firestore`, based on contracts in `docs/test/integration/firestore`. Keep browser-facing user flows in E2E tests.
- Each `it` or `it.each` title must include its specification ID. Update title references when specification IDs change. Parameterized rows may share an ID when their inputs and expected results are documented.
- Update the corresponding specification when adding or changing a test, including regressions. Do not mock the Firestore boundary being verified. Distinguish Adapter validation from Rules authorization.

### Storybook Integration Tests

- Verify public UI contracts from `docs/test/integration/storybook` with `play` functions in `src/**/*.stories.tsx`. Do not duplicate stories under `test/integration`.
- Prefix the relevant `play` step labels with their specification IDs. A shared play may reference multiple IDs, and inherited plays may share the same IDs. Keep these references aligned with specification changes.
- Test observable UI behavior with real composed components and forms. Mock only boundaries outside the contract, using story-side setup and public callback spies; do not add production interfaces solely for tests.
- Update the corresponding specification when adding or changing a play, including regressions. Rendering-only stories and setup-only plays do not verify behavior; a callback notification does not prove persistence or navigation.

### Other Unit and Integration Tests

- Unit tests with dedicated specifications under `docs/test/unit` must reference the relevant `UNIT-*` case ID in the test title. Documentation rules stay in the corresponding `docs/test/unit/**/AGENTS.md`.
- Unit/integration tests without a dedicated unit specification use `docs/test/e2e` as their runtime behavior specification and reference at least one existing E2E case ID in the outermost `describe` title, or the test title when there is no `describe`.
- Co-locate unit tests under `src/**/*.spec.{ts,tsx}` for deterministic rules, state transitions, validation, and module or component behavior without real external services.
- Put integration tests under `test/integration/**/*.spec.{ts,tsx}` for contracts across application modules, persistence, stores, or emulators. Do not mock the boundary being verified.
- Parameterized tests must include a representative row matching the referenced E2E Given / When / Then. Additional boundary-value or equivalence-class rows must preserve the same behavior and invariants.
- Do not derive cases or expected results solely from implementation details: branches, private functions, internal state shapes, mock call counts, or coverage gaps.
- Enforce static constraints, such as dependency direction and type correctness, with lint or typecheck rather than runtime tests; these checks do not require E2E IDs.
