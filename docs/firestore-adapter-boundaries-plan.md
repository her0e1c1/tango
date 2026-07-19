# Firestore Adapter Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Place Firestore-specific code under a named adapter, move remote-read contracts to a neutral module, and enforce the dependency direction required by Issue #315 without changing runtime behavior.

**Architecture:** `src/adapters/firestore` owns Firestore SDK calls, DTOs, mapping, collection names, runtime access helpers, and integration-test utilities. Query/application modules own Firebase-independent contracts and accept adapter operations through the existing function-injection boundaries; only explicit composition modules wire the concrete adapter.

**Tech Stack:** TypeScript, React, Firebase 10, TanStack Query, Vitest, Biome, ESLint

## Global Constraints

- Do not add `DeckRepository` or `CardRepository` interfaces.
- Do not change Firestore schema, offline cache behavior, synchronization behavior, or UI behavior.
- Do not combine the directory move with runtime behavior changes.
- Keep test-only `exists` and `removeAll` helpers out of production-facing contracts.
- Keep comments, commits, and pull request text in English.
- Run `make check` before publishing.

---

### Task 1: Encode the Firestore dependency boundaries

**Files:**
- Modify: `src/lib/componentArchitecture.spec.ts`

**Interfaces:**
- Consumes: existing `moduleReferences()`, `productionFilesUnder()`, and `importViolation()` helpers
- Produces: architecture assertions for presentation Firebase imports and concrete Firestore adapter imports

- [ ] **Step 1: Add failing architecture assertions**

Add a matcher for `firebase`, `firebase/*`, `@/firebase`, `@/adapters/firestore`, and the legacy `@/action/firestore` path. Scan shared and feature presentation files for Firebase dependencies. Scan production query, action, and feature files for concrete Firestore dependencies, allowing only these composition modules:

```ts
const firestoreCompositionModules = new Set([
  "query/remoteReadSession.ts",
  "features/card/hooks/useCardMutations.ts",
  "features/deck/hooks/useDeckMutations.ts",
  "features/import/hooks/useDeckImport.ts",
]);
```

Include direct unit assertions proving aliases, relative paths, and Firebase subpaths are recognized.

Also scan every production file outside `src/adapters/firestore` for `firebase/firestore` imports. Auth-specific `firebase/app` and `firebase/auth` imports remain outside this boundary; Firestore SDK imports do not.

- [ ] **Step 2: Run the architecture test and verify RED**

Run:

```bash
direnv exec . docker compose run --rm --remove-orphans --entrypoint npm dev exec vitest run --project=unit src/lib/componentArchitecture.spec.ts
```

Expected: FAIL listing current `@/action/firestore` references and confirming the new boundary detects the legacy layout.

- [ ] **Step 3: Commit the failing boundary test**

```bash
git add src/lib/componentArchitecture.spec.ts
git commit -m "Test Firestore adapter boundaries"
```

### Task 2: Extract Firebase-independent remote-read contracts

**Files:**
- Create: `src/query/remoteReadContract.ts`
- Modify: `src/query/remoteReadController.ts`
- Modify: `src/action/firestore/event.ts` before it is moved in Task 3
- Test: `src/query/remoteReadController.spec.ts`

**Interfaces:**
- Produces: `RemoteSnapshotMetadata`, `RemoteChange<T>`, `RemoteSnapshot<T>`, and `RemoteSubscriptionProps<T>` from `@/query/remoteReadContract`
- Consumes: domain `Deck` and `Card` globals already used by the query controller and adapter

- [ ] **Step 1: Add a failing contract-ownership test**

Extend the architecture test so query production files fail when they import types from `@/action/firestore` or `@/adapters/firestore`. Confirm `remoteReadController.ts` is reported because it currently imports `RemoteSnapshot` from the Firestore event module.

- [ ] **Step 2: Run the focused test and verify RED**

Run the Task 1 Vitest command. Expected: FAIL containing `query/remoteReadController.ts: @/action/firestore/event`.

- [ ] **Step 3: Create the neutral contract module**

Create these exact exported shapes:

```ts
export interface RemoteSnapshotMetadata {
  size: number;
  fromCache: boolean;
  hasPendingWrites: boolean;
}

export interface RemoteChange<T> {
  added: T[];
  modified: T[];
  removed: string[];
}

export type RemoteSnapshot<T> =
  | { type: "replace"; items: T[]; metadata: RemoteSnapshotMetadata }
  | { type: "change"; event: RemoteChange<T>; metadata: RemoteSnapshotMetadata };

export interface RemoteSubscriptionProps<T> {
  uid: string;
  onSnapshot: (snapshot: RemoteSnapshot<T>) => void;
  onError: (error: Error) => void;
}
```

Import these types from the query controller and Firestore event adapter, removing their Firestore-owned definitions.

- [ ] **Step 4: Run contract and controller tests and verify GREEN**

Run:

```bash
direnv exec . docker compose run --rm --remove-orphans --entrypoint npm dev exec vitest run --project=unit src/query/remoteReadController.spec.ts src/lib/componentArchitecture.spec.ts
```

Expected: controller tests pass; the architecture test remains red only for legacy adapter placement references handled by later tasks.

- [ ] **Step 5: Commit the neutral contract**

```bash
git add src/query/remoteReadContract.ts src/query/remoteReadController.ts src/action/firestore/event.ts src/lib/componentArchitecture.spec.ts
git commit -m "Extract remote read contracts"
```

### Task 3: Move the Firestore implementation into the adapter

**Files:**
- Move: `src/action/firestore/**` to `src/adapters/firestore/**`
- Move: `src/firestoreRuntime.ts` to `src/adapters/firestore/runtime.ts`
- Move: `src/firestoreRuntime.spec.ts` to `src/adapters/firestore/runtime.spec.ts`
- Move: `src/firestorePersistenceProbe.ts` to `src/adapters/firestore/persistenceProbe.ts`
- Move: `src/firestorePersistenceProbe.spec.ts` to `src/adapters/firestore/persistenceProbe.spec.ts`
- Modify: imports inside all moved TypeScript files
- Modify: `src/firebase.ts`
- Modify: `src/firebase.spec.ts`
- Modify: `package.json`
- Modify: `src/query/remoteReadSession.ts`
- Modify: `src/query/remoteReadSession.spec.ts`
- Modify: `src/auth/AuthLogout.integration.spec.tsx`

**Interfaces:**
- Produces: the existing `deck`, `card`, `event`, and `mocked` namespace exports from `@/adapters/firestore`
- Produces: `initializeFirestoreAdapter(app)`, `getDb`, `getFirestoreInitializationState`, `waitForFirestoreInitialization`, and `subscribeFirestoreInitialization` from the adapter runtime
- Consumes: neutral remote-read contracts from `@/query/remoteReadContract`

- [ ] **Step 1: Move the directory without changing implementation behavior**

Move every production file, unit/integration spec, emulator initializer, and rule spec from `src/action/firestore` to `src/adapters/firestore`, preserving filenames and subdirectories. Move the Firestore runtime and persistence probe beside the adapter and update internal imports from `@/action/firestore/*` and `@/firestoreRuntime` to adapter-local modules.

Extract the existing Firestore initialization block from `src/firebase.ts` into `initializeFirestoreAdapter(app)`. Keep the same cache selection, persistence verification, blocking behavior, emulator connection, and exported runtime accessors. `src/firebase.ts` continues to initialize the Firebase app and Auth, calls the adapter initializer once, and re-exports the existing accessors for compatibility, but no longer imports `firebase/firestore`.

- [ ] **Step 2: Update explicit read composition and mocks**

Change `remoteReadSession.ts` to import operations and runtime accessors from `@/adapters/firestore`. Update its spec and the logout integration spec to mock the new adapter path. Update Firebase bootstrap specs to mock or assert the extracted adapter initializer while preserving the existing initialization-state cases.

- [ ] **Step 3: Update the Firestore test script**

Change `test:firestore` in `package.json` to target `src/adapters/firestore`.

- [ ] **Step 4: Run moved adapter and read tests**

Run:

```bash
direnv exec . docker compose run --rm --remove-orphans --entrypoint npm dev exec vitest run --project=unit src/adapters/firestore src/query/remoteReadSession.spec.ts src/firebase.spec.ts
```

Expected: all selected tests pass, apart from emulator-only suites retaining their existing skip or environment behavior.

- [ ] **Step 5: Commit the adapter move**

```bash
git add src/action/firestore src/adapters/firestore src/firestoreRuntime.ts src/firestoreRuntime.spec.ts src/firestorePersistenceProbe.ts src/firestorePersistenceProbe.spec.ts src/firebase.ts src/firebase.spec.ts src/query/remoteReadSession.ts src/query/remoteReadSession.spec.ts src/auth/AuthLogout.integration.spec.tsx package.json
git commit -m "Move Firestore implementation into adapter"
```

### Task 4: Remove non-composition application dependencies on Firestore

**Files:**
- Modify: `src/action/deck.ts`
- Modify: `src/action/card.ts`
- Test: `src/action/deck.spec.ts`
- Test: `src/action/card.spec.ts`
- Modify: `src/features/import/hooks/useDeckImport.ts`
- Test: `src/features/import/hooks/useDeckImport.spec.tsx`

**Interfaces:**
- Produces: `deck.prepare(deck, uid, generateId)` and `card.prepare(card, deck, generateId)`
- Consumes: `firestore.mocked.generateDeckId` and `firestore.mocked.generateCardId` only from the import feature's composition hook

- [ ] **Step 1: Write failing ID-injection tests**

Change action tests to pass deterministic ID functions and assert they supply the entity IDs:

```ts
const deck = action.deck.prepare({ name: "name" }, "uid", () => "deck-id");
const card = action.card.prepare(rawCard, deck, () => "card-id");
```

Add an import-hook assertion that the hook wires Firestore-generated IDs into both calls.

- [ ] **Step 2: Run action/import tests and verify RED**

Run:

```bash
direnv exec . docker compose run --rm --remove-orphans --entrypoint npm dev exec vitest run --project=unit src/action/deck.spec.ts src/action/card.spec.ts src/features/import/hooks/useDeckImport.spec.tsx
```

Expected: FAIL because `prepare` does not yet accept the generator parameters and the import hook does not provide them.

- [ ] **Step 3: Inject ID generation**

Update the action signatures to require `generateId: () => string`, use it for `id`, and remove all adapter imports from `src/action/deck.ts` and `src/action/card.ts`. Import the concrete adapter only in `useDeckImport.ts` and pass the existing Firestore ID generators into each call.

- [ ] **Step 4: Run action/import tests and verify GREEN**

Run the Step 2 command. Expected: all selected tests pass.

- [ ] **Step 5: Commit the dependency inversion**

```bash
git add src/action/deck.ts src/action/card.ts src/action/deck.spec.ts src/action/card.spec.ts src/features/import/hooks/useDeckImport.ts src/features/import/hooks/useDeckImport.spec.tsx
git commit -m "Inject entity ID generation"
```

### Task 5: Wire mutation composition to the adapter and finish enforcement

**Files:**
- Modify: `src/features/deck/hooks/useDeckMutations.ts`
- Modify: `src/features/deck/hooks/useDeckMutations.spec.tsx`
- Modify: `src/features/card/hooks/useCardMutations.ts`
- Modify: `src/features/card/hooks/useCardMutations.spec.tsx`
- Modify: `src/lib/componentArchitecture.spec.ts`

**Interfaces:**
- Consumes: existing adapter `deck` and `card` operations
- Produces: no legacy `@/action/firestore` imports and passing architecture boundaries

- [ ] **Step 1: Update feature composition imports and test mocks**

Replace legacy imports and mocks with `@/adapters/firestore` in the deck and card mutation hooks and their specs. Do not alter mutation-service contracts or behavior.

- [ ] **Step 2: Run feature and architecture tests**

Run:

```bash
direnv exec . docker compose run --rm --remove-orphans --entrypoint npm dev exec vitest run --project=unit src/features/deck/hooks/useDeckMutations.spec.tsx src/features/card/hooks/useCardMutations.spec.tsx src/lib/componentArchitecture.spec.ts
```

Expected: all selected tests pass and architecture violations are empty.

- [ ] **Step 3: Prove legacy imports and directories are gone**

Run:

```bash
rg -n "@/action/firestore|src/action/firestore" src package.json
test ! -d src/action/firestore
```

Expected: no search matches and the directory assertion exits successfully.

- [ ] **Step 4: Commit completed wiring and enforcement**

```bash
git add src/features src/lib/componentArchitecture.spec.ts
git commit -m "Enforce Firestore adapter dependencies"
```

### Task 6: Update architecture and test documentation

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/summary/architecture.md`
- Modify: `docs/summary/er-diagram.md`
- Modify: `docs/summary/features.md`
- Modify: `docs/summary/testing.md`
- Modify: `docs/test-spec.md`

**Interfaces:**
- Consumes: final source paths and dependency boundaries
- Produces: documentation matching `src/adapters/firestore` and `src/query/remoteReadContract.ts`

- [ ] **Step 1: Replace obsolete paths and describe ownership**

Update Firestore implementation/test paths to `src/adapters/firestore`. State that neutral snapshot and subscription contracts live in `src/query/remoteReadContract.ts`, concrete operations are wired only in composition modules, and repository interfaces are intentionally absent.

- [ ] **Step 2: Verify documentation paths**

Run:

```bash
rg -n "src/action/firestore" docs
```

Expected: no matches except historical context in the approved design document where the previous ownership is explicitly described.

- [ ] **Step 3: Commit documentation**

```bash
git add docs
git commit -m "Document Firestore adapter boundaries"
```

### Task 7: Verify Issue #315 and publish

**Files:**
- Verify: all changed files

**Interfaces:**
- Produces: a pushed branch and pull request closing Issue #315

- [ ] **Step 1: Run focused dependency evidence checks**

Run the architecture test, query controller tests, mutation-service tests, and moved adapter tests. Expected: all pass with the mutation services and remote read controller using test doubles without Firebase initialization.

- [ ] **Step 2: Run the repository-required check**

Run:

```bash
direnv exec . make check
```

Expected: exit 0 with formatting, lint, type checking, and unit tests passing.

- [ ] **Step 3: Audit every Issue #315 completion condition**

Confirm with source searches and tests that presentation has no Firebase import, neutral contracts are not adapter-owned, services remain injectable, architecture enforcement is active, test helpers are absent from application contracts, documents use the new paths, and no schema/offline/sync behavior changed.

- [ ] **Step 4: Commit any verification-only fixes**

If verification required tracked fixes, stage only those fixes, inspect the staged patch, and commit with an English message describing them. If no fixes were required, do not create an empty commit.

- [ ] **Step 5: Push and open the pull request**

Push `codex/issue-315-firestore-adapter-boundaries` to `origin` and create a pull request against `main` with an English title and description, including `Closes #315`, implementation summary, and test evidence.
