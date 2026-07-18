# Route and Operation Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Issue #205 by giving startup, unknown routes, missing entities, remote reads, account operations, and Deck deletion consistent feedback and recovery behavior.

**Architecture:** Extend the existing stateless feedback layer with a full-route `RouteFeedback` component, while keeping auth, Query, settings, and Deck mutation state in their current owners. Route adapters and feature containers pass labels and recovery callbacks through props; operation-local hooks own pending, failure, duplicate suppression, and Retry.

**Tech Stack:** React 19, TypeScript 5, React Router 7, TanStack Query 5, Firebase Auth/Firestore, Vitest, Testing Library, Storybook 10, Playwright

## Global Constraints

- Work only in `.worktrees/agent/issue-205-feedback` on branch `agent/issue-205-feedback`, based on current `origin/main`.
- Do not commit files ignored by `.gitignore`.
- Write comments, commit messages, PR title, and PR description in English.
- Follow strict TDD: add one focused failing test, observe the expected failure, add minimal production code, and observe the test pass before continuing.
- Keep shared presentation components stateless and free of React Router, Query, Auth, Firebase, store, action, and feature imports.
- Preserve the #325 contract: Deck existence-check failures are read errors, never not-found states.
- Keep cached route content mounted during terminal sync errors.
- Keep failed edit/account/delete operations on their current route and expose Retry without automatic mutation retry.
- Before publishing, run `make check`; because this change adds Storybook and Playwright coverage, also run `make ci`.
- The draft PR must use `Closes #205` and `Refs #203`.

---

### Task 1: Shared Route Feedback and Application Startup

**Files:**
- Create: `src/components/feedback/RouteFeedback.tsx`
- Create: `src/components/feedback/RouteFeedback.spec.tsx`
- Create: `src/components/feedback/RouteFeedback.stories.tsx`
- Create: `src/components/feedback/RemoteReadBoundary.stories.tsx`
- Create: `src/components/feedback/RemoteMutationNotice.stories.tsx`
- Modify: `src/components/feedback/RemoteReadBoundary.tsx`
- Modify: `src/components/feedback/RemoteReadBoundary.spec.tsx`
- Modify: `src/components/feedback/RemoteMutationNotice.tsx`
- Modify: `src/components/feedback/RemoteMutationNotice.spec.tsx`
- Modify: `src/components/index.ts`
- Modify: `src/lib/componentArchitecture.spec.ts`
- Modify: `src/lib/sharedComponentPublicApi.spec.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.spec.tsx`

**Interfaces:**
- Produces: `RouteFeedbackProps`, `RouteFeedbackAction`, and `RouteFeedback` from `@/components`.
- Produces: `RemoteReadBoundaryProps.emptyContent?: React.ReactNode`.
- Produces: `RemoteMutationNoticeProps.pendingLabel?: string` and `errorLabel?: string` while preserving `Saving…` and `Unable to save changes.` defaults.

- [ ] **Step 1: Add failing `RouteFeedback` presentation tests**

Create tests that render loading, error, and not-found examples. Require a level-one heading, optional description, `role="status"` for non-error tones, `role="alert"` for error, and primary/secondary `Button` callbacks. Use real `RouteFeedback` and callbacks; do not mock `Button` or `Layout`.

Use this public shape:

```tsx
export type RouteFeedbackTone = "loading" | "error" | "not-found";

export interface RouteFeedbackAction {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
}

export interface RouteFeedbackProps {
  title: string;
  description?: string;
  tone?: RouteFeedbackTone;
  primaryAction?: RouteFeedbackAction;
  secondaryAction?: RouteFeedbackAction;
}
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/components/feedback/RouteFeedback.spec.tsx --no-file-parallelism
```

Expected: FAIL because `RouteFeedback` does not exist.

- [ ] **Step 3: Implement and export `RouteFeedback`**

Render a `Layout` containing one centered section with semantic surface, border, spacing, and text-token classes. Use `role="alert"` only for `tone="error"`; use `role="status"` otherwise. Render the secondary quiet action before the primary action. Export the component and named prop types from `src/components/index.ts`. Update architecture/public-API tests so `RouteFeedback`, `RemoteReadBoundary`, and `RemoteMutationNotice` are included in the feedback group and root API. Create their Storybook files at this step with the minimal default states needed by the architecture contract; Step 13 expands those files with every representative state.

- [ ] **Step 4: Run the focused component and architecture tests and confirm GREEN**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/components/feedback/RouteFeedback.spec.tsx src/lib/componentArchitecture.spec.ts src/lib/sharedComponentPublicApi.spec.ts --no-file-parallelism
```

Expected: PASS.

- [ ] **Step 5: Add failing boundary and notice tests**

Extend `RemoteReadBoundary.spec.tsx` to require:

```tsx
<RemoteReadBoundary
  status="ready"
  hasData={false}
  emptyContent={<RouteFeedback title="Deck not found" tone="not-found" />}
  onRetry={vi.fn()}
>
  content
</RemoteReadBoundary>
```

The custom empty surface must render instead of the string fallback. Existing loading, initial error, blocked storage, cached sync-error, and ordinary empty-string tests must remain.

Extend `RemoteMutationNotice.spec.tsx` to require custom `pendingLabel="Deleting deck…"` and `errorLabel="Unable to delete deck."`, while retaining default-copy tests.

- [ ] **Step 6: Run the boundary tests and confirm RED**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/components/feedback/RemoteReadBoundary.spec.tsx src/components/feedback/RemoteMutationNotice.spec.tsx --no-file-parallelism
```

Expected: FAIL because the new props are not supported.

- [ ] **Step 7: Extend the existing feedback components**

Add `emptyContent?: ReactNode` to `RemoteReadBoundary`. Use `RouteFeedback` for initial loading, initial error, and blocked storage; keep the existing inline `ErrorNotice` unchanged when `hasData` is true. For a successful empty read, render `emptyContent` when supplied and otherwise render a `RouteFeedback` using `emptyLabel ?? "No data yet."`.

Add optional pending/error labels to `RemoteMutationNotice` and default them at render time:

```tsx
const pendingLabel = props.pendingLabel ?? "Saving…";
const errorLabel = props.errorLabel ?? "Unable to save changes.";
```

- [ ] **Step 8: Run the boundary tests and confirm GREEN**

Run the Step 6 command. Expected: PASS.

- [ ] **Step 9: Add failing startup and wildcard route tests**

Update the App test harness to mock `useAuth` with complete `AuthState` values. Require:

- `initializing` and `signedOut` render `Starting Tango…` without route content;
- `error` renders `Unable to start Tango` and calls an injected `reload` callback;
- `authenticated` preserves normal route rendering;
- an authenticated unknown URL renders `Page not found`, and `Go home` navigates to `/`.

Define `App` as `React.FC<{ reload?: () => void }>` with the production default `() => window.location.reload()` so the test does not replace `window.location`.

- [ ] **Step 10: Run the App test and confirm RED**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/App.spec.tsx --no-file-parallelism
```

Expected: FAIL because App does not gate on auth or define a wildcard route.

- [ ] **Step 11: Implement startup gating and wildcard recovery**

Read auth state in `App`. Preserve the theme effect for every state. Before creating `BrowserRouter`, return:

- `RouteFeedback title="Starting Tango…" description="Preparing your decks and study progress." tone="loading"` for `initializing` and `signedOut`;
- `RouteFeedback title="Unable to start Tango" description="Authentication could not be initialized." tone="error" primaryAction={{ label: "Reload", onClick: reload }}` for `error`.

For authenticated state, render existing routes plus a `path="*"` adapter using `useNavigate`. Render `Page not found` with `Go back` calling `navigate(-1)` and `Go home` calling `navigate("/")`.

- [ ] **Step 12: Run the App test and confirm GREEN**

Run the Step 10 command. Expected: PASS.

- [ ] **Step 13: Add representative Storybook states**

Create autodocs stories under `Shared/Feedback` for:

- Route loading, error with Reload, not-found with Home/Back, and dark mode;
- remote initial loading, initial error, cached sync error with child content, blocked storage, and empty read;
- mutation pending, custom deleting pending, default error, and custom account error.

Use no-op Storybook action callbacks where interaction logging is unavailable.

- [ ] **Step 14: Run all Task 1 focused tests and commit**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/App.spec.tsx src/components/feedback/RouteFeedback.spec.tsx src/components/feedback/RemoteReadBoundary.spec.tsx src/components/feedback/RemoteMutationNotice.spec.tsx src/lib/componentArchitecture.spec.ts src/lib/sharedComponentPublicApi.spec.ts --no-file-parallelism
```

Expected: PASS.

Commit:

```bash
git add src/App.tsx src/App.spec.tsx src/components src/lib/componentArchitecture.spec.ts src/lib/sharedComponentPublicApi.spec.ts
git commit -m "Add shared route feedback"
```

---

### Task 2: Missing Deck and Card Recovery

**Files:**
- Modify: `src/features/deck/containers/DeckFormContainer.tsx`
- Modify: `src/features/deck/containers/DeckFormContainer.spec.tsx`
- Modify: `src/features/card/containers/CardFormContainer.tsx`
- Modify: `src/features/card/containers/CardFormContainer.spec.tsx`
- Modify: `src/features/card/containers/CardListContainer.tsx`
- Modify: `src/features/card/containers/CardViewContainer.tsx`
- Modify: `src/features/study/containers/DeckStartContainer.tsx`

**Interfaces:**
- Consumes: Task 1 `RouteFeedback` and `RemoteReadBoundaryProps.emptyContent`.
- Produces: consistent `Deck not found` and `Card not found` Home/Back recovery on every non-study entity route.

- [ ] **Step 1: Add failing representative missing-entity tests**

In `DeckFormContainer.spec.tsx`, render a successful read with `mocks.deck = null`; require `Deck not found`, `Go home`, and `Go back`. Click both actions in separate renders and require `navigate("/")` and `navigate(-1)`. Extend the router mock with `useNavigate`.

In `CardFormContainer.spec.tsx`, render with `mocks.card = null`; require `Card not found`, `Go home`, and `Go back`, and verify the same navigation calls.

Keep invalid missing route params as thrown programming errors.

- [ ] **Step 2: Run the representative tests and confirm RED**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/features/deck/containers/DeckFormContainer.spec.tsx src/features/card/containers/CardFormContainer.spec.tsx --no-file-parallelism
```

Expected: FAIL because current empty output has no recovery actions.

- [ ] **Step 3: Implement consistent recovery surfaces**

For each listed container, call `useNavigate` unconditionally and replace the entity-specific `emptyLabel` with:

```tsx
emptyContent={
  <RouteFeedback
    title="Deck not found"
    description="The requested deck is unavailable or has been removed."
    tone="not-found"
    primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
    secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
  />
}
```

Use the Card equivalent: `Card not found` and `The requested card is unavailable or has been removed.` Preserve `status={remote.status}` so read errors, including #325 Deck existence failures, continue to win before the successful-empty branch.

- [ ] **Step 4: Run the representative tests and confirm GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Run all affected container tests and commit**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/features/deck/containers/DeckFormContainer.spec.tsx src/features/card/containers/CardFormContainer.spec.tsx src/features/card/containers/CardListContainer.spec.tsx src/features/study/containers/DeckStartContainer.spec.tsx --no-file-parallelism
```

Expected: PASS.

Commit:

```bash
git add src/features/deck/containers src/features/card/containers src/features/study/containers
git commit -m "Add missing entity recovery"
```

---

### Task 3: Account Operation Feedback

**Files:**
- Create: `src/features/settings/hooks/useAccountOperations.ts`
- Create: `src/features/settings/hooks/useAccountOperations.spec.tsx`
- Modify: `src/features/settings/hooks/useConfigFormState.ts`
- Modify: `src/features/settings/hooks/useConfigFormState.spec.tsx`
- Modify: `src/features/settings/containers/ConfigContainer.tsx`
- Modify: `src/features/settings/containers/ConfigContainer.spec.tsx`
- Modify: `src/features/settings/components/ConfigForm.tsx`
- Modify: `src/features/settings/components/ConfigForm.spec.tsx`

**Interfaces:**
- Consumes: Task 1 label-aware `RemoteMutationNotice`.
- Produces: `useAccountOperations({ login, logout })` with `kind`, `pending`, `error`, `login`, `logout`, and `retry`.

- [ ] **Step 1: Add failing hook tests**

Use `renderHook` with deferred Promises. Require:

- two Login calls before the first settles return the same in-flight Promise and invoke the action once;
- Logout follows the same duplicate suppression;
- failure sets `error`, preserves `kind`, and Retry invokes the failed operation again;
- a new attempt clears the previous error and pending settles to false after success.

Use this signature:

```ts
interface AccountOperationDependencies {
  login: () => Promise<void>;
  logout?: () => Promise<void>;
}

type AccountOperationKind = "login" | "logout";
```

- [ ] **Step 2: Run the hook test and confirm RED**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/features/settings/hooks/useAccountOperations.spec.tsx --no-file-parallelism
```

Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Implement the account operation hook**

Store the latest dependencies, one in-flight Promise, and the last failed `AccountOperationKind` in refs, plus render state `{ kind, pending, error }`. `run(kind)` is not declared `async`; it returns the existing Promise object while pending so duplicate callers share the same result. It chooses the latest `login` or `logout` dependency, clears errors before starting, records failure, rethrows it, and clears the in-flight ref in `finally`. `retry()` replays the last failed kind and returns `Promise<void>`; it resolves immediately when there is no failed operation.

- [ ] **Step 4: Run the hook test and confirm GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Add failing Settings presentation/container tests**

Extend `UseConfigFormStateOptions` and `ConfigFormProps` expectations with:

```tsx
accountPending?: boolean;
accountFeedback?: React.ReactNode;
```

Require the visible Login or Logout button to be loading, disabled, and `aria-busy` while pending, and require the feedback slot inside the Account section.

In `ConfigContainer.spec.tsx`, mock `useAccountOperations` and require `ConfigContainer` to pass wrapped Login/Logout callbacks, pending state, and a `RemoteMutationNotice` with:

- `Signing in…` / `Unable to sign in.` for login;
- `Signing out…` / `Unable to sign out.` for logout;
- Retry wired to the hook.

- [ ] **Step 6: Run the Settings tests and confirm RED**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/features/settings/components/ConfigForm.spec.tsx src/features/settings/containers/ConfigContainer.spec.tsx --no-file-parallelism
```

Expected: FAIL because Settings does not expose account operation state.

- [ ] **Step 7: Wire account operation state into Settings**

Call the hook unconditionally with the existing `actions.login` and an optional authenticated logout closure. Pass `() => void account.login().catch(() => undefined)` and the Logout equivalent into `useConfigFormState`. Pass `accountPending` and a `RemoteMutationNotice` feedback slot through `useConfigFormState`/`ConfigFormProps`; use the kind-specific labels above. Render the slot below the Account action row and set the active Button's `loading={accountPending}`.

- [ ] **Step 8: Run all Task 3 tests and commit**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/features/settings/hooks/useAccountOperations.spec.tsx src/features/settings/components/ConfigForm.spec.tsx src/features/settings/containers/ConfigContainer.spec.tsx --no-file-parallelism
```

Expected: PASS.

Commit:

```bash
git add src/features/settings
git commit -m "Add account operation feedback"
```

---

### Task 4: Deck Deletion Guard and Browser Recovery Coverage

**Files:**
- Create: `src/features/deck/hooks/useDeckMutations.spec.tsx`
- Modify: `src/features/deck/hooks/useDeckMutations.ts`
- Modify: `src/features/deck/components/DeckCard.tsx`
- Modify: `src/features/deck/components/DeckCard.spec.tsx`
- Modify: `src/features/deck/components/DeckActionsMenu.tsx`
- Modify: `src/features/deck/components/DeckActionsMenu.spec.tsx`
- Modify: `src/features/deck/containers/DeckListContainer.tsx`
- Modify: `src/features/deck/containers/DeckListContainer.spec.tsx`
- Modify: `e2e/smoke.e2e.ts`

**Interfaces:**
- Consumes: Task 1 label-aware `RemoteMutationNotice` and Task 2 route recovery copy.
- Produces: `useDeckMutations().isPending(id: DeckId): boolean` and same-Deck in-flight Promise reuse.

- [ ] **Step 1: Add failing Deck mutation duplicate tests**

Model `useDeckMutations.spec.tsx` after the existing Card mutation hook spec. Use a deferred Firestore update/remove Promise and a real test QueryClient. Require:

- two same-Deck remove calls return the same Promise and call Firestore remove once;
- `pending` and `isPending(deck.id)` are true while active and false after settlement;
- a different Deck ID is not reported pending;
- failure remains available through `error` and Retry repeats the failed operation once.

- [ ] **Step 2: Run the hook test and confirm RED**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/features/deck/hooks/useDeckMutations.spec.tsx --no-file-parallelism
```

Expected: FAIL because entity pending state and duplicate suppression do not exist.

- [ ] **Step 3: Implement entity-scoped in-flight tracking**

Keep `useMutation` and the existing service. Add a `Map<DeckId, Promise<void>>` ref and a rendered `Set<DeckId>` state. Before starting a mutation, return the Map's Promise for that Deck ID when present. Add the ID before awaiting `mutateAsync`; remove it in `finally`. Preserve `lastFailed` and existing Retry semantics. Return `pending: pendingDeckIds.size > 0` and `isPending: (id) => pendingDeckIds.has(id)`.

- [ ] **Step 4: Run the hook test and confirm GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Add failing busy Deck presentation tests**

Extend `DeckCardActions` with `isPending?: (id: DeckId) => boolean`. Require a pending Deck card to:

- set `aria-busy="true"` on the article;
- disable View and Study/Continue;
- pass `disabled` to `DeckActionsMenu`, whose trigger is disabled and whose menu cannot remain open.

Require a non-pending Deck card to retain all current actions.

- [ ] **Step 6: Run the Deck presentation tests and confirm RED**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/features/deck/components/DeckCard.spec.tsx src/features/deck/components/DeckActionsMenu.spec.tsx --no-file-parallelism
```

Expected: FAIL because pending state is not wired.

- [ ] **Step 7: Wire pending state and accurate deletion copy**

Compute pending from `props.isPending?.(deck.id) ?? false` in `DeckCard`; disable its three interactive entry points and set `aria-busy`. Add `disabled?: boolean` to `DeckActionsMenu` and forward it to `ActionsMenu`.

In `DeckListContainer`, pass `isPending: mutations.isPending` through `deckCard` and render:

```tsx
<RemoteMutationNotice
  pending={mutations.pending}
  error={mutations.error}
  onRetry={mutations.retry}
  pendingLabel="Deleting deck…"
  errorLabel="Unable to delete deck."
/>
```

Update its hook mock in the container spec and require the selected pending row to be disabled while another row remains enabled.

- [ ] **Step 8: Run the Deck tests and confirm GREEN**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/features/deck/hooks/useDeckMutations.spec.tsx src/features/deck/components/DeckCard.spec.tsx src/features/deck/components/DeckActionsMenu.spec.tsx src/features/deck/containers/DeckListContainer.spec.tsx --no-file-parallelism
```

Expected: PASS.

- [ ] **Step 9: Add browser recovery tests**

Extend `e2e/smoke.e2e.ts` with authenticated tests for:

- `/unknown-route`: `Page not found` is visible and `Go home` returns to the Deck list;
- `/deck/missing-deck`: `Deck not found` is visible and `Go home` returns to the Deck list;
- `/card/missing-card`: `Card not found` is visible and `Go home` returns to the Deck list.

Each case must call `window.assertNoBrowserErrors()` after recovery.

- [ ] **Step 10: Run focused browser coverage and commit**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml:.devcontainer/compose.e2e.yaml docker compose up --wait --wait-timeout 120 --remove-orphans
COMPOSE_FILE=.devcontainer/compose.yaml:.devcontainer/compose.e2e.yaml docker compose run --rm --remove-orphans --env CI --entrypoint npm dev exec -- playwright test e2e/smoke.e2e.ts
```

Expected: all smoke tests PASS.

Commit:

```bash
git add src/features/deck e2e/smoke.e2e.ts
git commit -m "Prevent duplicate Deck deletion"
```

---

### Task 5: Repository Verification and Publication

**Files:**
- Verify all files changed since `origin/main`.

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: a verified branch ready for a draft PR.

- [ ] **Step 1: Re-read the design, plan, current diff, and status**

Run:

```bash
git status --short --branch
git diff --check origin/main...HEAD
git diff --stat origin/main...HEAD
```

Compare every design requirement with the committed diff. Confirm there are no ignored or unrelated files.

- [ ] **Step 2: Run the required lightweight gate**

Run:

```bash
make check
```

Expected: exit 0.

- [ ] **Step 3: Run the full CI-equivalent gate**

Run:

```bash
make ci
```

Expected: build, Storybook, formatting, lint, unit, Firestore, sample, and Playwright checks exit 0.

- [ ] **Step 4: Request whole-branch code review**

Review `origin/main...HEAD` against `docs/20260719-route-operation-feedback-design.md`. Fix every Critical or Important finding with focused tests and rerun the affected command. Rerun `make check` after fixes.

- [ ] **Step 5: Verify GitHub prerequisites and publish**

Run `gh --version`, `gh auth status`, and `git status --short --branch`. Push with tracking:

```bash
git push -u origin agent/issue-205-feedback
```

Create a draft PR targeting `main` with title `Unify route and operation feedback`. The body must summarize startup/route recovery, account/deletion feedback, Storybook/tests, include the actual verification commands, and end with:

```markdown
Closes #205
Refs #203
```
