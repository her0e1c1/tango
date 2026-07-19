# Query Module Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `src/query` into explicit cache, read, mutation, and selector responsibilities without changing runtime behavior.

**Architecture:** Add a typed `RemoteCache` boundary around entity-level QueryClient access, move read and mutation orchestration into named subdirectories, and extract derived-data operations from the React hook into pure selectors. Keep cleanup orchestration and the production client at the package root, preserve direct module imports, and add no Repository or barrel layer.

**Tech Stack:** React 19, TypeScript 5, TanStack Query 5, Firebase Firestore 10, Vitest 4, Testing Library

## Global Constraints

- Work on `codex/refactor-query-structure` in `.worktrees/codex/refactor-query-structure`, based on current `origin/main`.
- Preserve Firestore schema, offline persistence, listener recovery count, mutation retry policy, UI behavior, and the `useRemoteCollections` return API.
- Keep Firebase adapter extraction out of scope; that work belongs to Issue #315.
- Do not introduce a Repository, dependency-injection container, barrel export, or new runtime dependency.
- Write comments, commit messages, PR title, and PR description in English.
- Do not commit files ignored by `.gitignore`.
- Run `make check` before publishing the PR.

---

### Task 1: Add the Typed Remote Cache Boundary

**Files:**
- Create: `src/query/cache/firestoreKeys.ts`
- Create: `src/query/cache/firestoreKeys.spec.ts`
- Create: `src/query/cache/remoteCollection.ts`
- Create: `src/query/cache/remoteCache.ts`
- Create: `src/query/cache/remoteCache.spec.ts`
- Delete: `src/query/firestoreKeys.ts`
- Delete: `src/query/firestoreKeys.spec.ts`
- Modify: `src/features/card/hooks/useCardMutations.spec.tsx`
- Modify: `src/features/deck/hooks/useDeckMutations.spec.tsx`
- Modify: `src/query/cardMutationService.spec.ts`
- Modify: `src/query/cardMutationService.ts`
- Modify: `src/query/cleanup.spec.ts`
- Modify: `src/query/cleanup.ts`
- Modify: `src/query/deckMutationService.spec.ts`
- Modify: `src/query/deckMutationService.ts`
- Modify: `src/query/remoteReadController.spec.ts`
- Modify: `src/query/remoteReadController.ts`
- Modify: `src/query/useRemoteCollections.spec.tsx`
- Modify: `src/query/useRemoteCollections.ts`

**Interfaces:**
- Produces: `RemoteCollectionName = "decks" | "cards"`.
- Produces: `RemoteCollectionTypes = { decks: Deck; cards: Card }`.
- Produces: `RemoteCache.read(uid, collection)` and `RemoteCache.replace(uid, collection, next)`.
- Produces: `createRemoteCache(client: QueryClient): RemoteCache`.

- [ ] **Step 1: Write the failing cache test**

Add `remoteCache.spec.ts` with a real `QueryClient`. Require an empty result for an absent UID collection, isolated Deck/Card and UID writes, and typed replacement:

```ts
const cache = createRemoteCache(client);
expect(cache.read("uid-a", "decks")).toEqual({});
cache.replace("uid-a", "decks", { [deck.id]: deck });
cache.replace("uid-b", "cards", { [card.id]: card });
expect(cache.read("uid-a", "decks")).toEqual({ [deck.id]: deck });
expect(cache.read("uid-a", "cards")).toEqual({});
expect(cache.read("uid-b", "cards")).toEqual({ [card.id]: card });
```

- [ ] **Step 2: Run the test and confirm RED**

Run:

```bash
docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/query/cache/remoteCache.spec.ts --no-file-parallelism
```

Expected: FAIL because `remoteCache.ts` does not exist.

- [ ] **Step 3: Implement the cache boundary and move cache primitives**

Implement this public shape:

```ts
export interface RemoteCollectionTypes {
  decks: Deck;
  cards: Card;
}

export type RemoteCollectionName = keyof RemoteCollectionTypes;

export interface RemoteCache {
  read<Collection extends RemoteCollectionName>(
    uid: string,
    collection: Collection
  ): RemoteById<RemoteCollectionTypes[Collection]>;
  replace<Collection extends RemoteCollectionName>(
    uid: string,
    collection: Collection,
    next: RemoteById<RemoteCollectionTypes[Collection]>
  ): void;
}

export const createRemoteCache = (client: QueryClient): RemoteCache => {
  const read = <Collection extends RemoteCollectionName>(uid: string, collection: Collection) =>
    client.getQueryData<RemoteById<RemoteCollectionTypes[Collection]>>(collectionKeys[collection](uid)) ?? {};
  const replace = <Collection extends RemoteCollectionName>(
    uid: string,
    collection: Collection,
    next: RemoteById<RemoteCollectionTypes[Collection]>
  ) => {
    client.setQueryData(collectionKeys[collection](uid), next);
  };
  return { read, replace };
};
```

Move `firestoreKeys` and `RemoteById`/`toRemoteById` unchanged into `cache/`. Do not move optimistic rollback behavior with collection representation.

- [ ] **Step 4: Run cache tests and confirm GREEN**

Run:

```bash
docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/query/cache --no-file-parallelism
```

Expected: PASS.

- [ ] **Step 5: Commit the cache boundary**

```bash
git add src/query
git commit -m "refactor: isolate remote query cache access"
```

---

### Task 2: Isolate the Remote Read Lifecycle

**Files:**
- Create: `src/query/reads/syncState.ts`
- Create: `src/query/reads/syncState.spec.ts`
- Create: `src/query/reads/remoteReadController.ts`
- Create: `src/query/reads/remoteReadController.spec.ts`
- Create: `src/query/reads/remoteReadSession.ts`
- Create: `src/query/reads/remoteReadSession.spec.ts`
- Delete: `src/query/firestoreSyncController.ts`
- Delete: `src/query/firestoreSyncController.spec.ts`
- Delete: `src/query/remoteReadController.ts`
- Delete: `src/query/remoteReadController.spec.ts`
- Delete: `src/query/remoteReadSession.ts`
- Delete: `src/query/remoteReadSession.spec.ts`
- Modify: `src/query/cleanup.ts`
- Modify: `src/query/cleanup.spec.ts`
- Modify: `src/query/useRemoteCollections.ts`
- Modify: `src/query/useRemoteCollections.spec.tsx`
- Modify: `src/auth/AuthBootstrap.tsx`
- Modify: `src/auth/AuthBootstrap.spec.ts`
- Modify: `src/auth/AuthBootstrap.integration.spec.tsx`
- Modify: `src/auth/AuthLogout.integration.spec.tsx`

**Interfaces:**
- Renames: `FirestoreSyncState` to `RemoteReadState` and `createFirestoreSyncController` to `createSyncState`.
- Consumes: `RemoteCache` from Task 1.
- Preserves: `startRemoteReads`, `stopRemoteReads`, `retryRemoteReads`, blocker/state subscriptions, and controller `start/retry/stop/subscribe/getSnapshot` semantics.

- [ ] **Step 1: Move characterization tests and confirm they still target old imports**

Move the three read specs beside their new modules, then update only their imports to the intended names:

```ts
import { createSyncState } from "@/query/reads/syncState";
import { createRemoteReadController } from "@/query/reads/remoteReadController";
```

- [ ] **Step 2: Run read tests and confirm RED**

Run:

```bash
docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/query/reads --no-file-parallelism
```

Expected: FAIL because the new production modules do not exist.

- [ ] **Step 3: Move synchronization and session code**

Keep the state union and generation behavior unchanged:

```ts
export type RemoteReadState =
  | { uid: null; status: "idle" }
  | { uid: string; status: "loading" }
  | { uid: string; status: "ready"; syncStatus: RemoteSyncStatus }
  | { uid: string; status: "error"; error: Error };
```

Retain the cached/pending/synced precedence, stale-generation rejection, one automatic recovery, exhaustive listener teardown, and Firestore initialization blocker behavior.

- [ ] **Step 4: Replace controller QueryClient access with RemoteCache**

Change the dependency contract to:

```ts
export interface RemoteReadDependencies {
  cache: RemoteCache;
  subscribeDecks: (props: RemoteSubscriptionProps<Deck>) => Callback;
  subscribeCards: (props: RemoteSubscriptionProps<Card>) => Callback;
  applyChange: <T extends { id: string }>(
    previous: RemoteById<T>,
    event: { added?: T[]; modified?: T[]; removed?: string[] }
  ) => RemoteById<T>;
}
```

For a snapshot, call `cache.read(uid, collection)`, compute replace/change output, then call `cache.replace(uid, collection, next)`. Compose the production cache in `remoteReadSession.ts` with `createRemoteCache(queryClient)`.

- [ ] **Step 5: Run read, cleanup, and auth tests and confirm GREEN**

Run:

```bash
docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/query/reads src/query/cleanup.spec.ts src/auth --no-file-parallelism
```

Expected: PASS.

- [ ] **Step 6: Commit the read boundary**

```bash
git add src/query src/auth
git commit -m "refactor: isolate remote read lifecycle"
```

---

### Task 3: Isolate Mutation Coordination

**Files:**
- Create: `src/query/mutations/locks.ts`
- Create: `src/query/mutations/optimisticMutation.ts`
- Create: `src/query/mutations/cardMutationService.ts`
- Create: `src/query/mutations/cardMutationService.spec.ts`
- Create: `src/query/mutations/deckMutationService.ts`
- Create: `src/query/mutations/deckMutationService.spec.ts`
- Delete: `src/query/mutationLocks.ts`
- Delete: `src/query/remoteCollection.ts` after its collection helpers move to `cache/remoteCollection.ts`
- Delete: `src/query/cardMutationService.ts`
- Delete: `src/query/cardMutationService.spec.ts`
- Delete: `src/query/deckMutationService.ts`
- Delete: `src/query/deckMutationService.spec.ts`
- Modify: `src/features/card/hooks/useCardMutations.ts`
- Modify: `src/features/card/hooks/useCardMutations.spec.tsx`
- Modify: `src/features/deck/hooks/useDeckMutations.ts`
- Modify: `src/features/deck/hooks/useDeckMutations.spec.tsx`
- Modify: `src/features/import/hooks/useDeckImport.ts`
- Modify: `src/features/import/hooks/useDeckImport.spec.tsx`

**Interfaces:**
- Consumes: `RemoteCache` from Task 1.
- Preserves: Card/Deck service method signatures and `CardBulkMutationError` behavior.
- Preserves: lock keys, concurrency, conditional rollback, partial bulk refetch, and Deck-child Card coordination.

- [ ] **Step 1: Move mutation characterization tests and update imports**

Keep every existing assertion for optimistic values, rollback, listener overwrite protection, same-entity serialization, different-entity concurrency, authoritative bulk refetch, and Deck-child coordination.

- [ ] **Step 2: Run mutation tests and confirm RED**

Run:

```bash
docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/query/mutations --no-file-parallelism
```

Expected: FAIL because the new production modules do not exist.

- [ ] **Step 3: Extract optimistic rollback from collection representation**

Move the existing implementation under this contract:

```ts
export interface OptimisticMutationOptions<T, Result> {
  targetIds: string[];
  read: () => RemoteById<T>;
  replace: (next: RemoteById<T>) => void;
  update: (previous: RemoteById<T>) => RemoteById<T>;
  mutation: () => Promise<Result>;
}

export const runOptimisticMutation = async <T, Result>({
  targetIds,
  read,
  replace,
  update,
  mutation,
}: OptimisticMutationOptions<T, Result>): Promise<Result> => {
  const previous = read();
  const optimistic = update(previous);
  replace(optimistic);
  try {
    return await mutation();
  } catch (error) {
    const current = read();
    const rollback = { ...current };
    targetIds.forEach((id) => {
      if (!isEqual(current[id], optimistic[id])) return;
      const previousItem = previous[id];
      if (previousItem == null) delete rollback[id];
      else rollback[id] = previousItem;
    });
    replace(rollback);
    throw error;
  }
};
```

- [ ] **Step 4: Move services and use RemoteCache**

Replace each service dependency's `client: QueryClient` with `cache: RemoteCache`. Use `cache.read(uid, "cards")`, `cache.read(uid, "decks")`, and matching `replace` calls. Update feature hooks to compose one cache from their QueryClient and pass it to the service.

- [ ] **Step 5: Run mutation and feature tests and confirm GREEN**

Run:

```bash
docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/query/mutations src/features/card/hooks src/features/deck/hooks src/features/import/hooks --no-file-parallelism
```

Expected: PASS.

- [ ] **Step 6: Commit the mutation boundary**

```bash
git add src/query src/features
git commit -m "refactor: isolate remote mutation coordination"
```

---

### Task 4: Extract Pure Remote Collection Selectors

**Files:**
- Create: `src/query/selectors.ts`
- Create: `src/query/selectors.spec.ts`
- Modify: `src/query/useRemoteCollections.ts`
- Modify: `src/query/useRemoteCollections.spec.tsx`

**Interfaces:**
- Produces: `remoteValues`, `cardsForDeck`, `filteredCardsForDeck`, and `tagsForDeck` pure functions.
- Preserves: the full `useRemoteCollections` returned object and current time-based study filtering.

- [ ] **Step 1: Add failing selector tests**

Require undefined map entries to be omitted, cards to be filtered by Deck, tags to be unique and sorted, a missing Deck to return no filtered cards, and the supplied `now` value to reach `filterCardsForDeck` behavior:

```ts
expect(remoteValues({ first, missing: undefined })).toEqual([first]);
expect(cardsForDeck([cardA, cardB], deckA.id)).toEqual([cardA]);
expect(tagsForDeck([cardA, cardB], deckA.id)).toEqual(["a", "z"]);
expect(filteredCardsForDeck({}, [], "missing", config, now)).toEqual([]);
```

- [ ] **Step 2: Run selector tests and confirm RED**

Run:

```bash
docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/query/selectors.spec.ts --no-file-parallelism
```

Expected: FAIL because `selectors.ts` does not exist.

- [ ] **Step 3: Implement selectors and simplify the hook**

Use these signatures:

```ts
export const remoteValues = <T>(items: RemoteById<T>): T[];
export const cardsForDeck = (cards: Card[], deckId: DeckId): Card[];
export const filteredCardsForDeck = (
  decksById: RemoteById<Deck>,
  cards: Card[],
  deckId: DeckId,
  config: ConfigState,
  now: number
): Card[];
export const tagsForDeck = (cards: Card[], deckId: DeckId): string[];
```

Keep `Date.now()` at the hook call site so selector tests remain deterministic. The hook continues returning `decksById`, `cardsById`, arrays, status, sync status, error, retry, lookup helpers, relationship helpers, filtering, and tags.

- [ ] **Step 4: Run selector and hook tests and confirm GREEN**

Run:

```bash
docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/query/selectors.spec.ts src/query/useRemoteCollections.spec.tsx --no-file-parallelism
```

Expected: PASS.

- [ ] **Step 5: Commit selector extraction**

```bash
git add src/query
git commit -m "refactor: extract remote collection selectors"
```

---

### Task 5: Verify Boundaries and Publish

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/summary/architecture.md`
- Modify: `src/lib/componentArchitecture.spec.ts` only if its explicit query-module allowlist requires new paths

**Interfaces:**
- Documents: cache, read, mutation, and React integration data flow.
- Verifies: no production imports remain from deleted flat query modules.

- [ ] **Step 1: Update architecture documentation**

Document the two flows exactly:

```text
AuthBootstrap -> reads/session -> reads/controller -> cache/remoteCache -> QueryClient
feature hook -> mutations/service -> mutations/locks -> mutations/optimisticMutation -> cache/remoteCache -> Firestore
```

- [ ] **Step 2: Check deleted import paths and repository diff**

Run:

```bash
rg -n '@/query/(firestoreKeys|firestoreSyncController|remoteReadController|remoteReadSession|remoteCollection|mutationLocks|cardMutationService|deckMutationService)' src
git diff --check origin/main...HEAD
```

Expected: the search returns no matches, and the diff check exits successfully.

- [ ] **Step 3: Run all query tests**

Run:

```bash
docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/query --no-file-parallelism
```

Expected: PASS.

- [ ] **Step 4: Run the required repository gate**

Run:

```bash
make check
```

Expected: formatting, lint, TypeScript, sample build, and all unit tests pass.

- [ ] **Step 5: Commit documentation and final import cleanup**

```bash
git add docs src
git commit -m "docs: describe query module boundaries"
```

- [ ] **Step 6: Push and open the pull request**

Push `codex/refactor-query-structure` and create a PR into `main` with an English title and description. Include the architecture summary, behavior-preservation constraints, test evidence, and `Refs #315`.
