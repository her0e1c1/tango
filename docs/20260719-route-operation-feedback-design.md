# Route and Operation Feedback Design

## Goal

Finish Issue #205 against the current application architecture so startup, unknown routes, missing Deck/Card entities, remote read failures, account operations, and Deck deletion never leave the user with an unexplained or repeatable action.

## Current State

The Issue #205 background predates the completed Redux removal and component-directory flattening. There is no longer a `PersistGate`, and shared feedback components now live under `src/components/feedback`.

The current application already has two useful foundations:

- `RemoteReadBoundary` shows initial loading, retryable read failures, and non-destructive sync failures.
- `RemoteMutationNotice` shows mutation pending and failure states while edit forms remain mounted.

The remaining gaps are:

- auth startup and auth failure are not represented by the route UI;
- unknown routes render no route element;
- missing Deck/Card routes show plain text without Home or Back recovery;
- Login and Logout do not prevent repeated actions or expose failures;
- Deck deletion can be requested again while the first request is pending;
- the shared route and operation states are not represented in Storybook;
- focused route recovery and account-operation tests are absent.

## Selected Direction

Extend the existing feedback boundary instead of introducing a new global workflow store.

1. Add a stateless shared `RouteFeedback` presentation component for full-route loading, error, and not-found surfaces. It owns semantic Calm Focus presentation and receives all labels and callbacks through props.
2. Gate the router on Firebase-confirmed auth state. Initializing and anonymous bootstrap display `Starting Tango…`; an auth failure displays a reload action. `AuthBootstrap` remains responsible for remote subscription lifecycle.
3. Add a wildcard route and use the shared surface for unknown URLs. Missing Deck/Card containers pass a shared recovery surface into `RemoteReadBoundary` rather than returning a bare status string.
4. Keep cached remote content mounted during listener failures. `RemoteReadBoundary` continues to own Retry and non-destructive sync-error behavior.
5. Add a settings-owned account-operation hook for Login and Logout pending, failure, and retry state. Its module-scope controller survives a Logout-driven Settings unmount, but feedback may cross at most one auth-generation handoff.
6. Prevent a second Deck mutation for the same Deck while one is active, disable that Deck row's actions until the operation settles, and let the mutation hook own successful removal cleanup for both initial attempts and Retry.
7. Add Storybook stories for route feedback, remote-read states, and mutation states, plus focused unit and browser tests for recovery paths.

## Alternatives Considered

### Duplicate feedback in each route container

Each container could render its own heading, explanatory copy, and buttons. This minimizes changes to shared components but would immediately create different copy and accessibility behavior for Deck, Card, startup, and unknown-route states.

### Introduce a global application workflow store

A global store could own auth, route, read, and mutation feedback. It would centralize every status but would duplicate TanStack Query, Auth Context, React Hook Form, and feature-hook ownership. It would also make unrelated operations overwrite one another.

### Extend the existing shared boundaries

This is the selected approach. It preserves current state ownership, adds only presentation and operation-local state, and lets each feature pass the relevant action through props.

## Components and Responsibilities

### `RouteFeedback`

- Lives in `src/components/feedback` and remains stateless.
- Renders a route-sized Calm Focus surface with a heading, optional description, and up to two actions.
- Uses `role="status"` for loading and `role="alert"` for blocking failures.
- Accepts callbacks through props and does not import React Router, Query, Auth, Firebase, stores, or feature modules.

### `RemoteReadBoundary`

- Uses `RouteFeedback` for initial loading, blocking storage failure, and initial read failure.
- Preserves the inline error notice when cached route content exists.
- Accepts caller-provided empty content for entity-specific not-found recovery.
- Keeps the existing string fallback for ordinary empty collections such as an empty Deck list.

### `App`

- Reads `AuthState` and does not mount route content until a Firebase user is confirmed.
- Shows startup feedback for `initializing` and `signedOut` states.
- Shows blocking auth feedback with Reload for `error`.
- Adds a `*` route whose small router-aware adapter passes Home and Back callbacks to `RouteFeedback`.

### Missing entity containers

- Deck and Card route containers continue to determine existence from `useRemoteCollections`.
- When a successful read does not contain the requested entity, they provide `RouteFeedback` with entity-specific copy and Home/Back callbacks.
- Deck existence read errors introduced by #325 remain errors and must not be relabeled as not-found.

### Account operation hook

- Lives with settings hooks and wraps the existing `login` and `logout` actions.
- Uses a module-scope controller so an in-flight Logout and its feedback survive the Settings unmount caused by sign-out.
- Stores operation-local kind, pending state, last error, and the last failed operation for Retry. Failed-operation metadata distinguishes a full Logout that may still sign out from a cleanup continuation that cannot.
- Ignores a repeated request while an account operation is already running.
- Clears a previous error when a new attempt starts.
- Resets stale settled feedback when Settings is left or the auth generation changes, except for one bounded handoff of a post-sign-out cleanup failure to the next Settings mount. StrictMode remounts do not duplicate or prematurely reset the operation.

### Logout action

- `src/action/event.ts` signs out before starting query and study cleanup.
- Cleanup progress is phase-aware: Retry skips sign-out and any cleanup phase that already succeeded.
- The study cleanup continuation records the state produced by clearing and does not clear again if a new auth generation has already created different study state.
- A cleanup failure exposes its continuation on the error, while an ordinary sign-out failure retries the original full Logout.

### `ConfigForm`

- Receives account pending state and a feedback slot through props.
- Sets the active Login or Logout button to loading/disabled while the operation is pending.
- Keeps all settings controls and auto-save behavior available.

### Deck deletion

- `useDeckMutations` tracks active Deck IDs before starting the asynchronous mutation.
- A repeated mutation request for an active Deck ID is ignored.
- Its optional latest-ref `onRemoveSuccess(deck)` callback belongs to the hook operation, so initial removal and Retry perform the same study cleanup even if the Deck list unmounts before success.
- `DeckCard` receives entity-specific pending state, marks the row busy, and disables navigation and the actions menu for that Deck.
- Other Deck rows remain usable.

### `RemoteMutationNotice`

- Keeps its current default save copy.
- Accepts optional pending and error labels so account and deletion operations can use accurate language without creating another notice component.

## Interaction and Data Flow

### Startup

1. `AuthProvider` starts in `initializing`.
2. `App` renders `RouteFeedback` with `Starting Tango…` while `AuthContext` observes Firebase and completes anonymous bootstrap.
3. Once authenticated, `App` mounts the router. Route containers then use `RemoteReadBoundary` for remote initial loading.
4. If auth fails, route content stays unmounted and Reload restarts the application lifecycle.

### Unknown or missing route

1. React Router selects the wildcard route, or a feature container completes a read without finding its entity.
2. The adapter/container passes appropriate copy plus Home and Back callbacks to `RouteFeedback`.
3. Back uses browser history when available; Home always navigates to `/`.

### Account operation

1. The user selects Login or Logout.
2. The module-scope settings controller records the operation as pending before calling the existing action and reuses its exact Promise for duplicate requests.
3. The button becomes loading/disabled and the shared notice announces progress.
4. Logout signs out first, then runs query and study cleanup. A cleanup Retry resumes only unfinished cleanup and cannot sign out again.
5. A post-sign-out cleanup failure may cross the resulting auth-generation change once; a later Settings departure or unrelated generation clears it.
6. Success clears local operation state. Failure keeps or restores Settings feedback with Retry.

### Deck deletion

1. Confirmation remains required.
2. The mutation hook marks the Deck ID active before calling the mutation service.
3. The selected Deck row becomes busy and non-interactive.
4. Every successful remove attempt invokes the hook-owned latest success callback and removes the associated study session. Failure does not run cleanup and displays a retryable deletion error.

## Error Handling

- Auth startup failure is blocking because no confirmed UID may start reads or writes; Reload is the recovery action.
- Initial remote read failure replaces route content with Retry because there is no authoritative content to show.
- Listener failure with cached data remains non-destructive and displays Retry beside current content.
- Missing entity feedback is shown only after a successful read. Query/existence-check failures stay errors.
- Login, Logout, save, import, and delete failures remain operation-local; they do not navigate away or clear user input.
- Account Retry preserves whether the failed operation can still sign out; cleanup continuations never regain an auth handoff.
- Deck Retry replays only the last failed mutation and owns the same remove-success cleanup as the initial attempt.

## Testing

Use test-driven development for every behavior change.

- `RouteFeedback`: semantic role, copy, and Home/Back callbacks.
- `App`: startup gating, auth failure Reload, normal routing, and wildcard route recovery.
- `RemoteReadBoundary`: shared loading/error surface, cached non-destructive error, caller-provided not-found content, and Retry.
- Missing Deck/Card containers: not-found appears only after a successful read and recovery actions are wired.
- Account hook, `action/event.ts`, `AuthLogout.integration.spec.tsx`, and Settings: pending blocks duplicates, StrictMode preserves exact Promise reuse, Logout phases resume safely, and cleanup feedback crosses only its allowed auth handoff.
- Deck mutation and Deck card: same-Deck duplicates are blocked, other rows remain enabled, and a successful Retry runs study cleanup once after hook unmount.
- Storybook: representative loading, initial error, cached sync error, not-found, mutation pending, and mutation failure stories.
- Playwright: unknown route and missing Deck recovery routes.
- Repository verification: `make check` is required before completion.

## Out of Scope

- A generic React exception boundary for unexpected programming errors.
- CSV preview and validation, which remain owned by #207.
- Empty Deck/filter onboarding guidance, which remains owned by #206.
- Study completion or onboarding behavior, which remains owned by #208.
- Changes to Firebase auth providers, Firestore schema, query ownership, or mutation retry policy.
- A new global notification queue or application workflow store.
