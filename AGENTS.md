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

- Follow the current official Feature-Sliced Design guidance before repository-specific placement preferences.
- Prefer FSD v2.1 page-first: keep code with its consuming Page until actual reuse justifies a lower layer. A single-Page action or domain concept alone does not justify retaining a Feature or Entity slice.
- Treat recommended `@feature-sliced/steiger-plugin` rules as constraints. Resolve violations structurally; disable a recommended rule only when the user explicitly requests an exception.
- Move reusable cross-Page workflows to Features, reusable domain concepts, rules, and visual representations to Entities, and broadly reusable technical or UI primitives to Shared.
- UI components define their own props instead of reusing model return types. Keep locale-dependent formatting, such as dates and numbers, in UI rather than model hooks.

### Model organization

- Across Pages, Features, and Entities, put state-changing operations and workflows in `model/actions/`, and read-only getters, selectors, and derived data in `model/queries/`. Queries must not update state or initiate persistence.
- Give each action its own file and ordinary named function. Keep implementations out of actions objects, action factories, and hooks.
- Provide a Page model hook in `model/` to supply Page and Container values and bound action callbacks as named properties, not an actions object. Limit it to wiring stores, state hooks, queries, actions, and simple effects; no business rules, validation, derived-data calculations, state transitions, or async workflow sequencing.
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

- Do not add tests for non-application code. Assert observable behavior through the tested level's public boundary, not implementation details.
- Design production interfaces for production requirements. Do not add or change parameters, dependency objects, callbacks, factories, optional overrides, or exports solely for tests or mocks; use test-side module mocks or spies instead.

### Unit and Integration Tests

- Treat `docs/e2e` as the only runtime behavior specification; do not introduce separate unit/integration specification documents or ID systems. Define missing behavior there before writing tests; adding new files under `docs` still requires an explicit user request.
- Each new or modified unit/integration test for runtime behavior must reference at least one existing E2E case ID in its outermost `describe` title, or its test title when there is no `describe`.
- Co-locate unit tests under `src/**/*.spec.{ts,tsx}` for deterministic rules, state transitions, validation, and module or component behavior without real external services.
- Put integration tests under `test/integration/**/*.spec.{ts,tsx}` for contracts across application modules, persistence, stores, or emulators. Do not mock the boundary being verified.
- Parameterized tests must include a representative row matching the referenced E2E Given / When / Then. Additional boundary-value or equivalence-class rows must preserve the same behavior and invariants.
- Do not derive cases or expected results solely from implementation details: branches, private functions, internal state shapes, mock call counts, or coverage gaps.
- Enforce static constraints, such as dependency direction and type correctness, with lint or typecheck rather than runtime tests; these checks do not require E2E IDs.
