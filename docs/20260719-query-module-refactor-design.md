# Query Module Refactor Design

## Goal

Make `src/query` understandable by responsibility while preserving the existing Firestore synchronization, optimistic mutation, offline, and UI behavior.

## Current State

`src/query` currently mixes four different concerns in one flat directory:

- TanStack Query cache keys and collection representation;
- Firestore listener lifecycle, synchronization metadata, retry, and runtime initialization;
- optimistic mutation locking, rollback, and Deck/Card-specific write rules;
- React integration and derived Deck/Card selectors.

The individual modules are tested, but following one operation requires moving between files whose names do not expose their layer. Query cache access is also repeated in the read controller and both mutation services, while `useRemoteCollections` combines React subscriptions with application selectors.

## Selected Direction

Organize `src/query` into explicit `cache`, `reads`, and `mutations` boundaries, leaving the production Query client, cleanup orchestration, React hook, and pure selectors at the package root.

```text
src/query/
  cache/
    firestoreKeys.ts
    remoteCache.ts
    remoteCollection.ts
  reads/
    remoteReadController.ts
    remoteReadSession.ts
    syncState.ts
  mutations/
    cardMutationService.ts
    deckMutationService.ts
    locks.ts
    optimisticMutation.ts
  cleanup.ts
  client.ts
  selectors.ts
  useRemoteCollections.ts
```

Do not add a barrel module or a Repository abstraction. Callers continue importing the exact module that owns the behavior they use.

## Alternatives Considered

### Keep the flat directory and only rename functions

This would minimize import churn, but reads, writes, cache primitives, and React integration would remain visually indistinguishable. It does not address the main navigation problem.

### Move Deck and Card query code into feature directories

This would make entity ownership more visible, but Deck deletion coordinates Deck and Card state, and import flows depend on Card bulk writes. Moving shared server-state rules into features would introduce cross-feature dependencies.

### Introduce Deck and Card repositories

The existing services and read controller already accept testable function dependencies. Wrapping those functions in CRUD interfaces would duplicate the current seam and overlap Issue #315, whose scope is the Firestore adapter boundary.

## Responsibilities

### Cache

- `firestoreKeys.ts` owns UID-scoped Query keys.
- `remoteCollection.ts` owns Query-independent array/map transformations.
- `remoteCache.ts` is the only module that translates a UID and collection name into typed QueryClient reads, writes, and remote snapshot application.

The read controller and mutation services depend on `RemoteCache` rather than building keys and calling `QueryClient` directly.

### Reads

- `syncState.ts` aggregates Deck/Card snapshot metadata into `idle`, `loading`, `ready`, and `error` states.
- `remoteReadController.ts` owns listener attachment, teardown, generation checks, and one automatic recovery attempt.
- `remoteReadSession.ts` waits for Firestore runtime initialization and composes the production controller.

The read flow remains:

```text
AuthBootstrap -> read session -> read controller -> RemoteCache -> QueryClient
```

### Mutations

- `locks.ts` serializes operations that target the same Deck or Card while allowing unrelated entities to proceed concurrently.
- `optimisticMutation.ts` applies an optimistic value and conditionally rolls back only values that have not been replaced by a newer listener snapshot.
- `cardMutationService.ts` owns Card CRUD and partial bulk-upsert recovery.
- `deckMutationService.ts` owns Deck CRUD and coordinated child-Card cache removal.

The write flow remains:

```text
feature hook -> mutation service -> entity locks -> optimistic mutation -> RemoteCache -> Firestore write
```

### React Integration and Selectors

`useRemoteCollections.ts` only joins authenticated UID, external read state, Query subscriptions, and pure selectors. `selectors.ts` owns array conversion, entity lookup, Deck/Card relationships, tag collection, and study filtering.

The hook's returned API and value semantics remain unchanged so feature containers and hooks do not need behavioral changes.

## Error Handling and Concurrency Invariants

- Ignore snapshots and errors from stale UIDs or generations.
- Attempt automatic listener recovery once, then expose the terminal error.
- Attempt every unsubscribe even if another unsubscribe throws.
- Do not start listeners while Firestore initialization is blocked.
- Roll back only the failed mutation targets.
- Do not overwrite a newer listener snapshot during rollback.
- Serialize mutations for the same entity and allow different entities to run concurrently.
- Replace Card cache from an authoritative read after partial bulk-upsert failure.
- Restore a failed Deck deletion and its child Cards without overwriting newer values.
- Preserve logout cleanup order: stop listeners, cancel UID queries, then remove UID queries.

## Testing

- Keep the existing controller, session, mutation, cleanup, and hook tests as characterization coverage and move them beside their new modules.
- Add focused `remoteCache` tests for typed collection access and replace/change snapshots.
- Add pure selector tests for filtering undefined values, Deck/Card relationships, tags, and study filtering.
- Update feature imports and architecture rules to the new explicit paths.
- Run focused `src/query` tests during implementation and `make check` before publishing.

## Out of Scope

- Firestore schema or DTO changes.
- Firebase adapter placement or contract extraction covered by Issue #315.
- Query retry count, offline persistence, or listener recovery policy changes.
- UI behavior or returned `useRemoteCollections` API changes.
- A new dependency-injection container, Repository layer, or generic state framework.

## Completion Criteria

- Every `src/query` production module has one of the documented responsibilities.
- Read and mutation orchestration access Query data through `RemoteCache`.
- React subscription code and pure derived-data selectors are separate.
- Existing synchronization, cleanup, optimistic update, rollback, locking, and feature tests pass.
- New cache and selector unit tests pass.
- Documentation describes the new query module boundaries.
- `make check` succeeds.
