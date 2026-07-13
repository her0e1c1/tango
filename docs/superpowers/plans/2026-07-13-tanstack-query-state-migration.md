# TanStack Query State Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Firestore-backed deck/card を TanStack Query の UID-scoped cache へ移し、study session と一時 UI state を Zustand、localMode entity と長期設定を Redux に分離する。

**Architecture:** Firebase Auth が確認した live UID だけを remote data の入口にし、initial fetch と一組の realtime listener を application bootstrap が管理する。Feature container hook が Query の remote map と Redux の local map を合成し、remote mutation は awaited optimistic update/rollback、local mutation は Redux 同期 action で処理する。移行中だけ Redux remote mirror と mutation compatibility bridge を維持し、最後に削除する。

**Tech Stack:** React 18, TypeScript 5, TanStack Query, Zustand, Redux, redux-persist, Firebase Auth/Firestore, Vitest, Testing Library, Playwright, Docker Compose

---

## 実行契約

- Phase 1 は現在の worktree / branch で実装する。
  - Worktree: /Users/studio2022/workspace/tango/.worktrees/codex/issue-170-tanstack-query
  - Branch: codex/issue-170-tanstack-query
- Phase 2 以降は直前 Phase の PR が main へ merge された後、origin/main を fetch し、次の branch/worktree を作成する。
  - Phase 2: codex/issue-170-query-reads
  - Phase 3: codex/issue-170-card-mutations
  - Phase 4: codex/issue-170-deck-mutations
  - Phase 5: codex/issue-170-redux-cleanup
- 各 Phase は単独で deploy 可能な PR とし、次 Phase の変更を先取りしない。
- production code の変更は必ず failing test から開始し、focused test が green になってから commit する。
- 各 non-documentation Phase の完了前に make ci を実行する。
- presentation component/template は TanStack Query、Zustand、Firebase を import しない。
- persisted config.uid や persisted auth fields を Query key、listener、write authorization に使用しない。

## Container test command

Focused unit test:

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- <paths>

Focused Firestore emulator test:

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose up --wait --wait-timeout 120 --remove-orphans -d db
    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run <paths> --no-file-parallelism

Phase gate:

    make ci

## 最終 ownership と不変条件

| State | Final owner | Persistence |
| --- | --- | --- |
| Firestore deck/card | TanStack Query | Firestore only |
| Query/mutation pending and error | TanStack Query | none |
| Active study session | Zustand | LocalStorage |
| showBackText, autoPlay, lastSwipe | Zustand | none |
| localMode deck/card | Redux | redux-persist |
| Long-lived settings | Redux | redux-persist |
| Confirmed runtime auth | React auth context | Firebase Auth only |

Query keys:

    ["firestore"]
    ["firestore", uid]
    ["firestore", uid, "decks"]
    ["firestore", uid, "cards"]

Study state:

    interface StudySession {
      deckId: DeckId;
      cardOrderIds: CardId[];
      currentIndex: number;
    }

The route parameter remains the deck-selection source of truth. StudySession.deckId is only a mismatch guard.

---

# Phase 1: Client state separation

## Task 1: Add the versioned Zustand study store

**Files:**

- Modify: package.json
- Modify: package-lock.json
- Create: src/features/study/state/studyStore.ts
- Create: src/features/study/state/studyStore.spec.ts

- [ ] **Step 1: Write the failing state contract tests**

Cover:

- startStudy atomically sets deckId, cardOrderIds, and currentIndex 0.
- setCurrentIndex changes only the active session index.
- resetStudy clears the session but preserves legacyMigratedDeckIds.
- a selector returns a session only when its deckId matches the route deckId.
- initializeStudyUi sets showBackText false, autoPlay from defaultAutoPlay, and clears lastSwipe.
- showBackText, autoPlay, and lastSwipe are not serialized.
- session and legacyMigratedDeckIds are serialized with storage version 1.

Run:

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/features/study/state/studyStore.spec.ts

Expected: FAIL because the Zustand module does not exist.

- [ ] **Step 2: Install Zustand**

Run in the dev container:

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev install zustand

Expected: package.json and package-lock.json contain Zustand and installation exits 0.

- [ ] **Step 3: Implement the store**

Expose a testable store factory and the application hook. Persist only this shape under storage key tango-study:

    {
      session: StudySession | null;
      legacyMigratedDeckIds: Record<DeckId, true>;
    }

Keep these fields outside partialize:

    showBackText: boolean;
    autoPlay: boolean;
    lastSwipe?: SwipeDirection;

Actions must include startStudy, setCurrentIndex, resetStudy, markLegacyMigrated, initializeStudyUi, toggleShowBackText, toggleAutoPlay, setLastSwipe, and hideBackText.

- [ ] **Step 4: Run RED to GREEN**

Run the focused spec and TypeScript:

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/features/study/state/studyStore.spec.ts
    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run lint:tsc

Expected: PASS.

- [ ] **Step 5: Commit**

    git add package.json package-lock.json src/features/study/state
    git commit -m "feat: add persisted study session store"

## Task 2: Migrate one legacy study session without a Firestore write

**Files:**

- Create: src/store/migrations.ts
- Create: src/store/migrations.spec.ts
- Create: src/store/reducer.spec.ts
- Create: src/features/study/containers/useLegacyStudySession.ts
- Create: src/features/study/containers/useLegacyStudySession.spec.tsx
- Modify: src/action/type.ts
- Modify: src/store/reducer.ts
- Modify: src/store/index.ts

- [ ] **Step 1: Write failing reducer and persisted-state migration tests**

Add a pure deckClearLegacyStudy(deckId) action. Its reducer branch sets currentIndex to null and cardOrderIds to an empty array without calling any thunk or gateway.

Add redux-persist version 1 migration tests proving that showBackText, autoPlay, and lastSwipe are removed from persisted config while deck legacy fields remain available for one-time route migration.

Run:

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/store/reducer.spec.ts src/store/migrations.spec.ts

Expected: FAIL because the action and migration do not exist.

- [ ] **Step 2: Implement the pure Redux cleanup and persist migration**

Use createMigrate with an explicit version. The migration must tolerate absent slices and old persisted values. Do not remove remote entities or persisted auth yet; those are Phase 5 compatibility data.

- [ ] **Step 3: Write the failing legacy hook tests**

The hook accepts route deckId plus the rehydrated deck candidate. It imports only when:

- the Zustand session is empty;
- the route deck has a non-empty legacy cardOrderIds and a numeric currentIndex;
- legacyMigratedDeckIds does not contain that deckId.

The same operation must start the Zustand session, mark the deck migrated, and dispatch deckClearLegacyStudy. Cover React StrictMode double effects, an existing new-format session, a mismatched route, an already migrated deck, and reset followed by remount.

Run:

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/features/study/containers/useLegacyStudySession.spec.tsx

Expected: FAIL because the hook does not exist.

- [ ] **Step 4: Implement the idempotent hook**

The Zustand store action must perform the eligibility check and return whether an import occurred. Dispatch the pure Redux clear only when it returns true. This prevents a StrictMode duplicate dispatch and prevents stale re-import after reset.

- [ ] **Step 5: Run focused tests and commit**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/store/reducer.spec.ts src/store/migrations.spec.ts src/features/study/containers/useLegacyStudySession.spec.tsx

Expected: PASS.

    git add src/action/type.ts src/store src/features/study/containers/useLegacyStudySession.ts src/features/study/containers/useLegacyStudySession.spec.tsx
    git commit -m "feat: migrate legacy study progress once"

## Task 3: Move study orchestration out of deck/config Redux state

**Files:**

- Create: src/features/study/containers/useStudyActions.ts
- Create: src/features/study/containers/useStudyActions.spec.tsx
- Modify: src/features/study/containers/DeckStartContainer.tsx
- Modify: src/features/study/containers/DeckSwiperContainer.tsx
- Modify: src/features/study/containers/DeckSwiperContainer.spec.tsx
- Modify: src/features/study/containers/useStudyControllerState.ts
- Modify: src/features/study/containers/useStudyControllerState.spec.tsx
- Modify: src/features/deck/containers/useDeckActions.ts
- Modify: src/shared/hooks/useActions.ts
- Modify: src/features/card/containers/CardViewContainer.tsx

- [ ] **Step 1: Write the failing useStudyActions tests**

Start must:

- read filtered cards and long-lived config from Redux;
- call buildStudySession;
- call startStudy and initializeStudyUi(defaultAutoPlay);
- navigate only after the store is ready;
- never dispatch action.deck.update or configUpdate for session/UI fields.

Swipe must:

- reject route/session mismatch before a card write;
- use resolveSwipeAction, buildStudyPatch, and calculateNextIndex;
- dispatch the existing card mutation thunk only for a card patch;
- update index and lastSwipe only in Zustand;
- hide back text according to hideBodyWhenCardChanged;
- leave all state unchanged for DoNothing;
- set index -1 for GoBack without a deck write.

Run:

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/features/study/containers/useStudyActions.spec.tsx

Expected: FAIL because the hook does not exist.

- [ ] **Step 2: Implement useStudyActions**

Keep card writes on the Phase 1 legacy card thunk, because card mutations move in Phase 3. Remove start, swipe, and updateIndex from useDeckActions.

- [ ] **Step 3: Convert the study controller to controlled autoPlay**

Write a failing test that rerendered autoPlay is reflected immediately and onToggleAutoPlay delegates to the passed Zustand callback. Remove the hook-local useState copy.

- [ ] **Step 4: Cut over DeckStartContainer and DeckSwiperContainer**

DeckSwiperContainer derives the current card ID from the route-guarded Zustand session. During a possible legacy migration, do not navigate away until hydration/migration has completed. A missing session, mismatched deck, missing current card, or terminal index resets the session and navigates to top according to existing policy.

Use Zustand for Enter, Space, showBackText, autoPlay, and lastSwipe. showHeader and showSwipeButtonList remain long-lived Redux config.

- [ ] **Step 5: Remove unrelated study UI toggles**

Remove toggleShowBackText and toggleAutoPlay from the shared action facade. CardViewContainer must not mutate study UI state when displaying a standalone card.

- [ ] **Step 6: Run focused tests and commit**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/features/study/containers/useStudyActions.spec.tsx src/features/study/containers/DeckSwiperContainer.spec.tsx src/features/study/containers/useStudyControllerState.spec.tsx

Expected: PASS.

    git add src/features/study src/features/deck/containers/useDeckActions.ts src/shared/hooks/useActions.ts src/features/card/containers/CardViewContainer.tsx
    git commit -m "refactor: move study flow to Zustand"

## Task 4: Move deck progress presentation to the active session

**Files:**

- Create: src/features/deck/components/DeckCard.spec.tsx
- Modify: src/features/deck/components/DeckCard.tsx
- Modify: src/features/deck/components/templates/DeckListTemplate.tsx
- Modify: src/features/deck/containers/DeckListContainer.tsx
- Modify: src/features/deck/components/DeckCard.stories.tsx
- Modify: src/features/deck/components/templates/DeckListTemplate.stories.tsx
- Modify: src/shared/storybook/fixture.ts

- [ ] **Step 1: Write failing presentation tests**

Replace Deck.currentIndex/cardOrderIds access with an optional presentation prop:

    interface StudyProgress {
      currentIndex: number;
      cardCount: number;
    }

Cover active deck progress text, restart enabled for the active session, restart disabled for other decks, and no progress when session is absent.

- [ ] **Step 2: Implement props-only progress rendering**

DeckListContainer reads the single Zustand session and supplies StudyProgress only to its matching deck. DeckCard and DeckListTemplate must remain state-library agnostic.

- [ ] **Step 3: Update stories and verify**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/features/deck/components/DeckCard.spec.tsx
    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run build:storybook

Expected: PASS.

- [ ] **Step 4: Commit**

    git add src/features/deck src/shared/storybook/fixture.ts
    git commit -m "refactor: render deck progress from study session"

## Task 5: Enforce the Firestore DTO boundary and remove legacy entity fields

**Files:**

- Create: src/action/firestore/dto.ts
- Create: src/action/firestore/dto.spec.ts
- Modify: src/action/firestore/deck.ts
- Modify: src/action/firestore/deck.spec.ts
- Modify: src/action/firestore/card.ts
- Modify: src/action/firestore/card.spec.ts
- Modify: src/vite-env.d.ts
- Modify: src/action/deck.ts
- Modify: src/action/deck.spec.ts
- Modify: src/action/card.ts
- Modify: src/action/card.spec.ts
- Modify: src/action/config.spec.ts
- Modify: src/selector/card.ts
- Modify: src/lib/study.ts
- Modify: src/lib/study.spec.ts
- Modify: affected container specs and Storybook fixtures

- [ ] **Step 1: Write failing pure DTO tests**

Deck create/update DTOs explicitly allow server fields and omit id from update payload, undefined optional fields, localMode, currentIndex, cardOrderIds, showBackText, autoPlay, and lastSwipe. Card DTOs explicitly allow card server fields and omit id/undefined fields from update payload.

Run the Firestore path directly because test:unit excludes that directory:

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/action/firestore/dto.spec.ts --no-file-parallelism

Expected: FAIL because DTO builders do not exist.

- [ ] **Step 2: Route all Firestore writes through DTO builders**

Do not spread a Deck, Card, or edit request into setDoc/updateDoc. Preserve explicit createdAt/updatedAt behavior. Read mapping of old documents is Phase 2, but Phase 1 writes must stop emitting all client-only fields.

- [ ] **Step 3: Remove new-format dependencies on legacy fields**

Remove currentIndex and cardOrderIds from Deck and remove showBackText, autoPlay, and lastSwipe from ConfigState. Define a narrow LegacyStudyFields type only at the migration boundary.

Delete:

- action.deck.start and action.deck.swipe;
- unused action.card.goTo;
- selector.card.getCurrentByDeckId;
- unused calculateGoToIndex.

Update deck preparation and all fixtures to the new entity shape.

- [ ] **Step 4: Run focused TypeScript, unit, and emulator tests**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run lint:tsc
    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/action/deck.spec.ts src/action/card.spec.ts src/action/config.spec.ts src/lib/study.spec.ts src/features/deck/containers/DeckFormContainer.spec.tsx src/features/card/containers/CardListContainer.spec.tsx
    make test-firestore

Expected: PASS, and emulator assertions show no client-only field in writes.

- [ ] **Step 5: Commit**

    git add src
    git commit -m "refactor: separate client state from Firestore entities"

## Task 6: Update local-mode E2E storage and pass the Phase 1 gate

**Files:**

- Modify: e2e/swipe.e2e.ts
- Modify: e2e/deck.e2e.ts
- Modify: e2e/card.e2e.ts
- Modify: e2e/smoke.e2e.ts

- [ ] **Step 1: Make swipe E2E fail on the new storage contract**

Seed tango-study as:

    {
      state: {
        session: {
          deckId: "e2e-deck-1",
          cardOrderIds: ["e2e-card-1", "e2e-card-2"],
          currentIndex: 0
        },
        legacyMigratedDeckIds: {}
      },
      version: 1
    }

Remove study fields from the Redux deck/config fixture. Assert after a swipe that tango-study session.currentIndex is 1 and persist:root does not recreate those fields.

- [ ] **Step 2: Update all local fixtures**

Remove client-only fields from deck/config fixtures while preserving localMode data and long-lived settings.

- [ ] **Step 3: Run focused E2E**

    COMPOSE_FILE=.devcontainer/compose.yaml:.devcontainer/compose.e2e.yaml docker compose up --wait --wait-timeout 120 --remove-orphans
    COMPOSE_FILE=.devcontainer/compose.yaml:.devcontainer/compose.e2e.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run e2e -- e2e/swipe.e2e.ts

Expected: PASS.

- [ ] **Step 4: Run Phase 1 gate**

    make ci

Expected: all builds, format checks, lint, unit, Firestore, sample, and E2E tests pass.

- [ ] **Step 5: Commit any fixture-only corrections**

    git add e2e
    git commit -m "test: seed Zustand study sessions in E2E"

---

# Phase 2: Query reads and realtime

## Task 7: Add the Query client, keys, and test provider

**Files:**

- Modify: package.json
- Modify: package-lock.json
- Create: src/query/client.ts
- Create: src/query/client.spec.ts
- Create: src/query/firestoreKeys.ts
- Create: src/query/firestoreKeys.spec.ts
- Create: src/query/testUtils.tsx
- Modify: src/main.tsx

- [ ] **Step 1: Write failing Query foundation tests**

Cover exact UID keys, EntityMap normalization, bounded query retry, mutation retry false, and a fresh retries-off QueryClient per test. Query option factories are intentionally deferred until Task 8 because their queryFn gateways do not exist yet.

- [ ] **Step 2: Install TanStack Query**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev install @tanstack/react-query

- [ ] **Step 3: Implement the module-scope client and key factory**

firestoreKeys.ts exports EntityMap and firestoreKeys. No file in Task 7 imports the not-yet-created Firestore full-fetch API.

- [ ] **Step 4: Add QueryClientProvider**

Wrap App inside QueryClientProvider without changing Redux Provider/PersistGate behavior.

- [ ] **Step 5: Verify and commit**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/query/client.spec.ts src/query/firestoreKeys.spec.ts

Expected: PASS.

    git add package.json package-lock.json src/query src/main.tsx
    git commit -m "feat: add UID-scoped Query foundation"

## Task 8: Add explicit Firestore read mappers and full fetch

**Files:**

- Create: src/action/firestore/mapper.ts
- Create: src/action/firestore/mapper.spec.ts
- Modify: src/action/firestore/deck.ts
- Modify: src/action/firestore/deck.spec.ts
- Modify: src/action/firestore/card.ts
- Modify: src/action/firestore/card.spec.ts
- Modify: src/action/firestore/index.ts
- Create: src/query/firestore.ts
- Create: src/query/firestore.spec.ts

- [ ] **Step 1: Write failing mapper tests**

Remote deck mapping must:

- use document ID as id;
- add localMode false;
- ignore old currentIndex, cardOrderIds, and localMode document fields;
- apply existing defaults for optional deck fields.

Card mapping must ignore logically deleted documents and apply existing learning defaults.

- [ ] **Step 2: Write failing emulator full-fetch tests**

fetchDecks(uid) and fetchCards(uid) return normalized maps containing only that UID. Deleted cards are absent.

- [ ] **Step 3: Implement read mappers, getDocs gateways, and Query option factories**

The gateway must not import React, Redux, Zustand, or Query. src/query/firestore.ts exports deckQueryOptions(uid) and cardQueryOptions(uid) using the Task 7 keys plus the new gateways. Both factories set staleTime Infinity and refetchOnWindowFocus false. Containers and bootstrap import these factories instead of reconstructing keys/queryFn. Query normalization may be a pure adapter called by the option factory if keeping the gateway return value as arrays makes the boundary cleaner.

- [ ] **Step 4: Verify and commit**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/action/firestore/mapper.spec.ts src/action/firestore/deck.spec.ts src/action/firestore/card.spec.ts --no-file-parallelism
    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/query/firestore.spec.ts

Expected: PASS.

    git add src/action/firestore src/query/firestore.ts
    git commit -m "feat: fetch mapped Firestore entities by UID"

## Task 9: Replace cursor subscriptions with an initial-aware realtime gateway

**Files:**

- Modify: src/action/firestore/event.ts
- Modify: src/action/firestore/event.spec.ts
- Modify: src/vite-env.d.ts

- [ ] **Step 1: Rewrite the skipped suite as failing tests**

Required cases:

- an empty first snapshot still emits isInitial true;
- a non-empty first snapshot is initial;
- later snapshots use isInitial false;
- added, modified, removed, and logical deletion are mapped;
- onError receives listener failures;
- the returned unsubscribe stops callbacks;
- no updatedAt cursor is accepted.

- [ ] **Step 2: Implement subscribeDecks and subscribeCards**

Rename onCange to onChange. Emit every first snapshot, including an empty change set. Keep includeMetadataChanges only if tests prove it does not duplicate authoritative events.

- [ ] **Step 3: Run emulator tests and commit**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose up --wait --wait-timeout 120 --remove-orphans -d db
    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev exec -- vitest run src/action/firestore/event.spec.ts --no-file-parallelism

Expected: PASS with no describe.skip.

    git add src/action/firestore/event.ts src/action/firestore/event.spec.ts src/vite-env.d.ts
    git commit -m "feat: expose initial-aware Firestore listeners"

## Task 10: Add the Redux compatibility mirror

**Files:**

- Modify: src/action/type.ts
- Modify: src/store/reducer.ts
- Modify: src/store/reducer.spec.ts

- [ ] **Step 1: Write failing replacement tests**

Initial deck replacement drops stale remote decks, preserves local decks, and gives local entities precedence on collision. Initial card replacement drops stale remote cards and preserves only cards whose owning deck is local. Empty initial maps clear remote mirror data. Subsequent events use applyRealtimeChange. Recompute categories/tags from the resulting maps.

- [ ] **Step 2: Add dedicated mirror actions**

Use distinct remoteMirrorReplace and remoteMirrorApply actions so the temporary mutation bridge can ignore listener fan-out. Card actions receive localDeckIds because a Card has no localMode discriminator.

- [ ] **Step 3: Verify immutable map construction**

Never share or mutate the same object reference between Query cache and Redux mirror.

- [ ] **Step 4: Run tests and commit**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/store/reducer.spec.ts src/lib/realtimeChange.spec.ts

Expected: PASS.

    git add src/action/type.ts src/store/reducer.ts src/store/reducer.spec.ts
    git commit -m "feat: add transitional remote Redux mirror"

## Task 11: Build the generation-safe remote data controller

**Files:**

- Create: src/query/remoteDataController.ts
- Create: src/query/remoteDataController.spec.ts

- [ ] **Step 1: Write failing lifecycle tests with deferred promises**

Cover:

- each deck/card listener starts only after its corresponding fetch succeeds;
- the first listener event fully replaces Query and Redux remote maps;
- subsequent events apply a diff to both;
- UID change increments generation and synchronously unsubscribes before cache cleanup;
- cancelQueries happens before removeQueries;
- a delayed old fetch cannot start a listener or recreate cache/mirror;
- a delayed old listener event is ignored;
- logout clears old UID Query and only remote Redux entities;
- listener error stops the active pair, performs one forced network refetch that bypasses staleTime Infinity, and reconnects on success;
- failed refetch exposes one sync error plus manual retry;
- status snapshots transition through idle, syncing, connected, reconnecting, and error;
- subscribe/getSnapshot notifies React consumers without storing errors in Redux;
- initializing/signed-out auth starts nothing.

Run:

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/query/remoteDataController.spec.ts

Expected: FAIL because the controller does not exist.

- [ ] **Step 2: Implement a dependency-injected controller**

getDocs cannot be assumed abortable. Every async completion and listener callback must compare captured UID/generation with the current generation. A reconnect replaces the listener pair under a fresh generation. Expose subscribe, getSnapshot, and retry so React and mutation hooks use one authoritative connectivity/error state.

- [ ] **Step 3: Verify and commit**

Run the focused spec; expected PASS.

    git add src/query/remoteDataController.ts src/query/remoteDataController.spec.ts
    git commit -m "feat: coordinate Query fetch and realtime lifecycle"

## Task 12: Separate live auth, remote bootstrap, and theme lifecycle

**Files:**

- Create: src/auth/AuthContext.tsx
- Create: src/auth/AuthContext.spec.tsx
- Create: src/query/RemoteDataBootstrap.tsx
- Create: src/query/RemoteDataBootstrap.spec.tsx
- Create: src/query/RemoteSyncContext.tsx
- Create: src/query/RemoteSyncContext.spec.tsx
- Create: src/shared/components/feedback/SyncStatus.tsx
- Create: src/shared/components/feedback/SyncStatus.spec.tsx
- Modify: src/shared/components/index.ts
- Modify: src/lib/sharedComponentPublicApi.spec.ts
- Modify: src/main.tsx
- Modify: src/App.tsx
- Modify: src/action/event.ts
- Modify: src/action/event.spec.ts
- Modify: src/shared/hooks/useActions.ts

- [ ] **Step 1: Write failing AuthContext tests**

Cover initializing, confirmed authenticated user, listener error, cleanup unsubscribe, and initial null user. Preserve current anonymous-first behavior: an initial null user triggers signInAnonymously once and remote work waits for the resulting confirmed user. Google link/sign-in and logout operate on Firebase Auth, not persisted config.uid.

- [ ] **Step 2: Write failing bootstrap tests**

Only AuthContext authenticated state starts the remote controller. A persisted config.uid without a live user starts nothing. During Phases 2 through 4, the confirmed auth snapshot is mirrored to Redux config solely for legacy thunks/settings. Logout explicitly awaits controller cleanup before signOut and existing local/config reset policy.

- [ ] **Step 3: Write failing sync notification and retry tests**

RemoteSyncContext adapts controller subscribe/getSnapshot/retry for React consumers. SyncStatus is a stateless presentation component. When controller state is error, the application renders a non-destructive message and Retry action; clicking Retry delegates once to controller.retry. Reconnecting is visible without replacing route content, and a successful reconnect clears the error. Export useRemoteSync so Phase 3/4 mutations can decide whether success needs fallback invalidation/refetch.

- [ ] **Step 4: Implement provider/bootstrap composition**

Put AuthProvider, RemoteSyncContext, and RemoteDataBootstrap above App. Render SyncStatus alongside route content. App keeps only a darkMode DOM effect and routes; changing darkMode must not recreate auth or Firestore listeners.

- [ ] **Step 5: Remove duplicate legacy initialization**

Stop dispatching action.event.init/subscribe from App. Keep only transitional auth commands needed by settings, or move them to src/auth and leave a compatibility export.

- [ ] **Step 6: Verify and commit**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/auth/AuthContext.spec.tsx src/query/RemoteDataBootstrap.spec.tsx src/query/RemoteSyncContext.spec.tsx src/shared/components/feedback/SyncStatus.spec.tsx src/action/event.spec.ts

Expected: PASS.

    git add src/auth src/query/RemoteDataBootstrap.tsx src/query/RemoteDataBootstrap.spec.tsx src/query/RemoteSyncContext.tsx src/query/RemoteSyncContext.spec.tsx src/shared/components src/lib/sharedComponentPublicApi.spec.ts src/main.tsx src/App.tsx src/action/event.ts src/action/event.spec.ts src/shared/hooks/useActions.ts
    git commit -m "refactor: separate auth remote sync and theme"

## Task 13: Bridge legacy optimistic Redux mutations into Query

**Files:**

- Create: src/query/compatibilityBridge.ts
- Create: src/query/compatibilityBridge.spec.ts
- Modify: src/store/index.ts
- Modify: src/action/deck.spec.ts
- Modify: src/action/card.spec.ts

- [ ] **Step 1: Write failing middleware tests**

After the reducer runs:

- a remote deck/card insert, update, or delete patches only the attached live UID key;
- local entity actions do not touch Query;
- stale/other UID actions are ignored;
- mirror listener actions are ignored;
- detach prevents late actions from recreating cache;
- card ownership is resolved from pre-state for delete and post-state for insert/update.

- [ ] **Step 2: Implement one temporary middleware**

The remote controller attaches the Firebase-confirmed UID/generation to the bridge. Never read config.uid. Capture pre-state, call next(action), then inspect post-state and patch a cloned Query map.

- [ ] **Step 3: Verify existing immediate UI behavior**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/query/compatibilityBridge.spec.ts src/action/deck.spec.ts src/action/card.spec.ts

Expected: PASS.

- [ ] **Step 4: Commit**

    git add src/query/compatibilityBridge.ts src/query/compatibilityBridge.spec.ts src/store/index.ts src/action/deck.spec.ts src/action/card.spec.ts
    git commit -m "feat: mirror legacy mutations into Query cache"

## Task 14: Add merged read hooks and cut over every container

**Files:**

- Create: src/query/readModel.ts
- Create: src/query/readModel.spec.ts
- Create: src/features/deck/containers/useDeckReads.ts
- Create: src/features/deck/containers/useDeckReads.spec.tsx
- Create: src/features/card/containers/useCardReads.ts
- Create: src/features/card/containers/useCardReads.spec.tsx
- Create: src/features/study/containers/useCurrentStudyCard.ts
- Create: src/features/study/containers/useCurrentStudyCard.spec.tsx
- Create: src/shared/components/feedback/ReadState.tsx
- Modify: src/shared/components/index.ts
- Modify: src/lib/sharedComponentPublicApi.spec.ts
- Modify: every deck/card/study container
- Modify: relevant container specs

- [ ] **Step 1: Write failing pure merge tests**

Merge remote first and local second. Local wins ID collision; report collisions in development/test. Signed-out local data must be available without a Query result.

- [ ] **Step 2: Write failing hook state tests**

Return an explicit discriminated state: pending, error, notFound, or success. Cover UID isolation, retry, local success while remote is pending, merged filtering/tags, and useCardWithDeck(cardId) without conditional hooks.

- [ ] **Step 3: Implement deck/card/study read hooks**

Keep legacy selectors for mutation thunk lookup through Phase 4. Add local-map selectors instead of changing legacy selector semantics underneath them.

- [ ] **Step 4: Cut over deck containers**

Migrate DeckListContainer and DeckFormContainer first. Add pending/error/notFound/success container tests.

- [ ] **Step 5: Cut over card containers**

Migrate CardListContainer, CardViewContainer, and CardFormContainer. Use one useCardWithDeck hook for the card route.

- [ ] **Step 6: Cut over study containers**

Migrate DeckStartContainer and DeckSwiperContainer. Current study card comes from the Phase 1 route-guarded session plus merged card reads.

- [ ] **Step 7: Verify architecture and containers**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/query/readModel.spec.ts src/features/deck/containers src/features/card/containers src/features/study/containers src/lib/componentArchitecture.spec.ts src/lib/importPath.spec.ts src/lib/sharedComponentPublicApi.spec.ts

Expected: PASS and no presentation file imports Query/Zustand/Firebase.

- [ ] **Step 8: Commit by feature**

Use three small commits:

    git commit -m "refactor: read decks from merged Query model"
    git commit -m "refactor: read cards from merged Query model"
    git commit -m "refactor: read study cards from merged Query model"

## Task 15: Add remote integration coverage and pass the Phase 2 gate

**Files:**

- Create: e2e/remote-query.e2e.ts
- Modify: e2e support/seed files as needed

- [ ] **Step 1: Add a failing remote scenario**

Cover authenticated initial remote deck/card render, an emulator-side realtime modification, logout/UID switch removing prior entities, and local deck visibility while remote is unavailable.

- [ ] **Step 2: Run all gateway and architecture checks**

    make test-firestore
    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts src/lib/importPath.spec.ts src/lib/sharedComponentPublicApi.spec.ts

- [ ] **Step 3: Run Phase 2 gate**

    make ci

Expected: PASS.

- [ ] **Step 4: Commit**

    git add e2e
    git commit -m "test: cover remote Query synchronization"

---

# Phase 3: Card mutations and swipe

## Task 16: Serialize optimistic entity lifecycles

**Files:**

- Create: src/query/entityMutationQueue.ts
- Create: src/query/entityMutationQueue.spec.ts

- [ ] **Step 1: Write failing queue tests**

Use a QueryClient-scoped WeakMap and key uid:entityType:entityId. Cover:

- the second operation for the same card cannot take its snapshot until the first settles;
- two failures restore the true pre-chain value in order;
- different entity IDs run concurrently;
- rejection always releases the queue;
- deck deletion can acquire deck and sorted child-card keys without deadlock.

- [ ] **Step 2: Implement acquire/release**

Acquire the lock in async onMutate before reading the rollback snapshot. Return the release token in mutation context and release it in onSettled. Do not rely only on TanStack mutation scope, because optimistic callbacks can otherwise overlap.

- [ ] **Step 3: Verify and commit**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/query/entityMutationQueue.spec.ts

Expected: PASS.

    git add src/query/entityMutationQueue.ts src/query/entityMutationQueue.spec.ts
    git commit -m "feat: serialize entity mutation lifecycles"

## Task 17: Add local/remote card mutation hooks

**Files:**

- Create: src/features/card/containers/useCardMutations.ts
- Create: src/features/card/containers/useCardMutations.spec.tsx
- Modify: src/action/firestore/dto.ts
- Modify: src/action/firestore/dto.spec.ts
- Modify: src/action/firestore/card.ts
- Modify: src/action/firestore/card.spec.ts
- Modify: src/action/card.ts
- Modify: src/action/card.spec.ts
- Modify: src/shared/hooks/useActions.ts

- [ ] **Step 1: Characterize validation and backend choice with failing tests**

Existing card operations resolve the merged card, then its owning deck. New cards resolve the target deck. Reject missing deck, missing live UID for remote, or UID mismatch before any cache/Redux/gateway change.

- [ ] **Step 2: Write failing optimistic tests**

Local create/update/delete dispatch Redux only. Remote operations:

- generate create ID before onMutate;
- snapshot only the target card entry and whether it existed, under that card's entity lock;
- optimistically insert/patch/remove;
- await the gateway;
- rollback only that target entry on rejection, using a functional cache update so concurrent successful mutations to other card IDs are preserved;
- expose pending/error;
- disable automatic retry;
- consume useRemoteSync and invalidate/refetch only when realtime connectivity is degraded.

- [ ] **Step 3: Tighten Card DTO and gateway expectations**

Update DTO permits only mutable server fields, omits undefined optional values, and prevents ownership/id mutation. All gateway calls return awaited promises.

- [ ] **Step 4: Implement while retaining legacy callers**

Add the hook and gateway behavior, but keep remote card mutation thunks and card handling in compatibilityBridge until Tasks 18 through 20 migrate every caller. This intermediate commit must still pass TypeScript and existing behavior tests.

- [ ] **Step 5: Verify and commit**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/features/card/containers/useCardMutations.spec.tsx src/action/card.spec.ts
    make test-firestore

Expected: PASS.

    git add src/features/card/containers/useCardMutations.ts src/features/card/containers/useCardMutations.spec.tsx src/action/firestore src/action/card.ts src/action/card.spec.ts src/shared/hooks/useActions.ts
    git commit -m "feat: mutate cards through Query"

## Task 18: Cut over card forms/lists with pending and error UI

**Files:**

- Modify: src/features/card/containers/CardFormContainer.tsx
- Modify: src/features/card/containers/CardFormContainer.spec.tsx
- Modify: src/features/card/containers/CardListContainer.tsx
- Modify: src/features/card/containers/CardListContainer.spec.tsx
- Modify: src/features/card/containers/useCardFormState.ts
- Modify: src/features/card/components/CardForm.tsx
- Modify: src/features/card/components/templates/CardFormTemplate.tsx

- [ ] **Step 1: Add failing interaction tests**

Form navigation occurs only after mutateAsync resolves. On rejection the route remains, submit is re-enabled, optimistic data is rolled back, and an operation-local error is shown. List score swipes/delete use the card value resolved at invocation time and ignore repeated input while pending.

- [ ] **Step 2: Implement container-only state integration**

Pass isSubmitting and error presentation props into stateless form/template components. Do not import Query in presentation.

- [ ] **Step 3: Verify and commit**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/features/card/containers/CardFormContainer.spec.tsx src/features/card/containers/CardListContainer.spec.tsx

Expected: PASS.

    git add src/features/card
    git commit -m "feat: surface card mutation status"

## Task 19: Make study swipe one rollback-safe mutation

**Files:**

- Create: src/features/study/containers/useStudySwipe.ts
- Create: src/features/study/containers/useStudySwipe.spec.tsx
- Modify: src/features/study/containers/DeckSwiperContainer.tsx
- Modify: src/features/study/containers/DeckSwiperContainer.spec.tsx
- Modify: src/features/study/containers/useStudyActions.ts
- Modify: src/features/study/containers/useStudyControllerState.ts
- Modify: src/features/study/containers/useStudyControllerState.spec.tsx
- Modify: src/features/study/components/SwipeButtonList.tsx
- Modify: src/features/study/components/templates/DeckSwiperTemplate.tsx

- [ ] **Step 1: Write failing two-state rollback tests**

Test the exact order:

1. validate route/session deck;
2. snapshot the current card entry and previous Zustand index;
3. compute patch/index with pure helpers;
4. optimistically patch card and index;
5. await remote write;
6. on failure restore only that card entry plus the index, preserving unrelated card mutations.

Also cover DoNothing, GoBack, terminal reset, and local card success.

- [ ] **Step 2: Write failing concurrency tests**

While the current card mutation is pending, keyboard, button, overlay, gesture, slider, and autoplay inputs are no-ops. A rejection leaves the same card ready for retry.

- [ ] **Step 3: Implement swipe orchestration**

Use useCardMutations as the only card writer. Timer advancement must go through the same pending guard and must not directly advance the index around a card mutation.

- [ ] **Step 4: Verify and commit**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/features/study/containers/useStudySwipe.spec.tsx src/features/study/containers/DeckSwiperContainer.spec.tsx src/features/study/containers/useStudyControllerState.spec.tsx

Expected: PASS.

    git add src/features/study
    git commit -m "feat: rollback failed study swipes"

## Task 20: Move import card work to an operation-level mutation

**Files:**

- Create: src/features/import/lib/csv.ts
- Create: src/features/import/lib/csv.spec.ts
- Create: src/features/import/containers/useDeckImport.ts
- Create: src/features/import/containers/useDeckImport.spec.tsx
- Modify: src/features/import/containers/DeckImportContainer.tsx
- Create or modify: src/features/import/containers/DeckImportContainer.spec.tsx
- Modify: src/action/deck.ts
- Modify: src/action/card.ts
- Modify: src/action/card.spec.ts
- Modify: src/query/compatibilityBridge.ts
- Modify: src/query/compatibilityBridge.spec.ts

- [ ] **Step 1: Extract and characterize CSV parsing**

Preserve the current row mapping and unique-key behavior. Record that splitByUniqueKey is currently global; do not silently change it to per-deck scope in this issue.

- [ ] **Step 2: Write failing import operation tests**

Phase 3 may call a narrow legacy deck-create adapter, but all card create/update work uses one operation-level mutation. Local import touches Redux only. The remote operation acquires its sorted affected-card keys, snapshots and rolls back only those entries, and preserves unrelated concurrent mutations. After a partial failure it force-refetches cards and decks because server partial success is possible. Navigation occurs only after success.

- [ ] **Step 3: Implement pending/error UI**

Expose one operation pending/error state to DeckImportContainer. Do not create one independent mutation status per imported card.

- [ ] **Step 4: Remove the legacy card mutation path**

After form/list, swipe, and import all use useCardMutations, delete remote card mutation thunks, retaining only pure preparation/CSV helpers. Remove card handling from compatibilityBridge and keep only the deck bridge for Phase 4.

Run:

    rg -n "action\\.card\\.(bulkCreate|bulkUpdate|update|updateBy|remove)" src

Expected: no runtime caller of the legacy mutation API.

- [ ] **Step 5: Verify Phase 3**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/features/import/lib/csv.spec.ts src/features/import/containers/useDeckImport.spec.tsx src/features/import/containers/DeckImportContainer.spec.tsx
    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/action/card.spec.ts src/query/compatibilityBridge.spec.ts
    make ci

Expected: PASS.

- [ ] **Step 6: Commit**

    git add src/features/import src/action/deck.ts src/action/card.ts src/action/card.spec.ts src/query/compatibilityBridge.ts src/query/compatibilityBridge.spec.ts
    git commit -m "feat: import cards through one mutation"

---

# Phase 4: Deck mutations and workflows

## Task 21: Add local/remote deck mutation hooks

**Files:**

- Create: src/features/deck/containers/useDeckMutations.ts
- Create: src/features/deck/containers/useDeckMutations.spec.tsx
- Modify: src/action/firestore/dto.ts
- Modify: src/action/firestore/dto.spec.ts
- Modify: src/action/firestore/deck.ts
- Modify: src/action/firestore/deck.spec.ts

- [ ] **Step 1: Write failing backend/validation tests**

New deck captures config.localMode when the request is built. Existing update/delete resolves merged deck.localMode. Remote operations validate live UID against entity UID before mutation.

- [ ] **Step 2: Write failing optimistic lifecycle tests**

Local operations use Redux only. Remote create/update/delete use entity locks, awaited gateway calls, and no automatic retry. Create/update snapshot and rollback only the target deck entry with a functional cache update, so concurrent successful mutations to other decks survive.

Deck delete snapshots only the target deck entry and its current child-card entries, then removes that exact entity set atomically. It waits for/acquires the deck and sorted child-card locks so a concurrent child-card rollback cannot recreate deleted data. Failure restores only those captured entries with functional cache updates, preserving unrelated deck/card mutations.

- [ ] **Step 3: Implement and verify**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/features/deck/containers/useDeckMutations.spec.tsx
    make test-firestore

Expected: PASS.

- [ ] **Step 4: Commit**

    git add src/features/deck/containers/useDeckMutations.ts src/features/deck/containers/useDeckMutations.spec.tsx src/action/firestore
    git commit -m "feat: mutate decks through Query"

## Task 22: Cut over deck forms, list actions, and filter autosave

**Files:**

- Modify: src/features/deck/containers/DeckFormContainer.tsx
- Modify: src/features/deck/containers/DeckFormContainer.spec.tsx
- Modify: src/features/deck/containers/DeckListContainer.tsx
- Modify: src/features/deck/containers/useDeckActions.ts
- Modify: src/features/deck/containers/useDeckFilterState.ts
- Modify: src/features/deck/containers/useDeckFilterState.spec.tsx
- Modify: src/shared/hooks/useActions.ts
- Modify: relevant deck presentation props for pending/error

- [ ] **Step 1: Add failing form/list tests**

Await save/delete. Navigate only after success. Keep screen and show error on failure. Disable repeated same-entity actions while pending.

- [ ] **Step 2: Add rapid filter-update tests**

Rapid watch emissions serialize on the deck key and the final successful filter value wins. A preceding rollback must not overwrite a later optimistic patch.

- [ ] **Step 3: Implement container integration**

Keep Query and Zustand imports in containers/hooks only.

- [ ] **Step 4: Verify and commit**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/features/deck/containers/DeckFormContainer.spec.tsx src/features/deck/containers/useDeckFilterState.spec.tsx src/features/deck/containers/useDeckMutations.spec.tsx

Expected: PASS.

    git add src/features/deck src/shared/hooks/useActions.ts
    git commit -m "feat: surface deck mutation status"

## Task 23: Move download, import, and reimport to the merged model

**Files:**

- Create: src/features/deck/lib/deckCsv.ts
- Create: src/features/deck/lib/deckCsv.spec.ts
- Modify: src/features/import/containers/useDeckImport.ts
- Modify: src/features/import/containers/useDeckImport.spec.tsx
- Modify: src/features/import/containers/DeckImportContainer.tsx
- Modify: src/features/deck/containers/DeckListContainer.tsx
- Modify: src/action/deck.ts
- Modify: src/action/deck.spec.ts
- Modify: src/query/compatibilityBridge.ts
- Modify: src/query/compatibilityBridge.spec.ts

- [ ] **Step 1: Characterize download and reimport**

Download reads only the merged deck/card model. Reimport performs fetch, parse, then one import operation; failure preserves the screen and exposes the error.

- [ ] **Step 2: Replace the Phase 3 deck-create adapter**

Use useDeckMutations for create/update/delete throughout import and reimport.

- [ ] **Step 3: Remove remaining deck mutation thunks and bridge**

Retain pure prepare/name/CSV helpers only if still used, preferably moving them under feature lib. Remove deck handling from compatibilityBridge; its tests should prove the bridge is now empty/removable in Phase 5.

- [ ] **Step 4: Verify Phase 4**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/features/deck/lib/deckCsv.spec.ts src/features/import/containers/useDeckImport.spec.tsx src/query/compatibilityBridge.spec.ts
    make ci

Expected: PASS.

- [ ] **Step 5: Commit**

    git add src/features/deck src/features/import src/action/deck.ts src/action/deck.spec.ts src/query
    git commit -m "refactor: migrate deck workflows to Query"

---

# Phase 5: Redux cleanup and documentation

## Task 24: Cut settings to runtime auth

**Files:**

- Modify: src/features/settings/containers/ConfigContainer.tsx
- Modify: src/features/settings/components/ConfigForm.tsx
- Modify: src/features/settings/containers/useConfigFormState.ts
- Modify: relevant settings container/hook specs

- [ ] **Step 1: Add failing runtime-auth settings tests**

UID, anonymous state, and display name come from AuthContext. ConfigForm receives a narrow runtime identity prop instead of reading those values from ConfigState. Login/logout uses auth commands and never a persisted identity snapshot. Remove the Last Updated display before lastUpdatedAt is deleted.

- [ ] **Step 2: Implement the settings cutover and verify it**

Keep the legacy ConfigState identity fields temporarily for Phase 2 through 4 bootstrap compatibility, but leave no settings/UI reader of them.

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/features/settings

Expected: PASS.

- [ ] **Step 3: Commit**

    git add src/features/settings
    git commit -m "refactor: read settings identity from runtime auth"

## Task 25: Delete remote compatibility and migrate Redux to local-only data

**Files:**

- Delete: src/action/event.ts
- Delete: src/action/event.spec.ts
- Delete: src/query/compatibilityBridge.ts
- Delete: src/query/compatibilityBridge.spec.ts
- Modify: src/store/migrations.ts
- Modify: src/store/migrations.spec.ts
- Modify: src/store/index.ts
- Modify: src/action/type.ts
- Modify: src/store/reducer.ts
- Modify: src/selector/deck.ts
- Modify: src/selector/card.ts
- Modify: src/action/index.ts
- Modify: src/action/config.ts
- Modify: src/action/config.spec.ts
- Modify: src/vite-env.d.ts
- Modify or delete obsolete sections: src/action/deck.ts
- Modify or delete obsolete sections: src/action/card.ts
- Modify: src/query/remoteDataController.ts
- Modify: src/query/remoteDataController.spec.ts
- Modify: src/query/RemoteDataBootstrap.tsx
- Modify: src/query/RemoteDataBootstrap.spec.tsx
- Modify: src/auth/AuthContext.tsx
- Modify: src/shared/hooks/useActions.ts
- Keep and simplify: src/action/firestore/event.ts
- Keep: src/lib/realtimeChange.ts
- Modify: e2e/card.e2e.ts
- Modify: e2e/deck.e2e.ts
- Modify: e2e/swipe.e2e.ts
- Modify: e2e/smoke.e2e.ts
- Modify: corresponding specs

- [ ] **Step 1: Add failing local-only invariant and version 2 migration tests**

Normal Redux deck actions accept only localMode decks. Card actions accept only cards belonging to local decks. There are no remote replacement/diff actions after Phase 4.

The migration retains only localMode decks and their cards; removes remote entities, lastUpdatedAt, uid, isAnonymous, and displayName; preserves long-lived settings; and tolerates absent/old slices plus repeated migration.

- [ ] **Step 2: Delete compatibility code**

Remove module-global subscriptions, deckOnChange, cardOnChange, removeFromLocal, lastUpdatedAt cursor/helper, auth-to-Redux sync, the remote mirror, and both temporary mutation bridges.

Change remoteDataController so first/subsequent snapshots update Query only and cleanup no longer dispatches mirror actions. Change RemoteDataBootstrap/AuthContext so confirmed auth is no longer copied into Redux. Move the remaining login/logout command surface out of action/event before deleting it, and update action/config plus useActions callers.

Now remove lastUpdatedAt, uid, isAnonymous, and displayName from ConfigState and reducer defaults. Task 24 has already removed every UI reader, so this step remains type-safe.

Do not delete the thin Phase 2 Firestore listener or applyRealtimeChange; the Query-only remote controller still uses them.

- [ ] **Step 3: Implement the local-only persisted-state migration**

Bump redux-persist to version 2 with createMigrate only after auth-to-Redux synchronization has been removed in the same task. This prevents removed identity fields from being written back under an already-migrated version.

Update E2E fixtures so persist:root contains local entities and long-lived config only, tango-study contains the study session, and no persisted auth snapshot exists.

- [ ] **Step 4: Run a static legacy search**

    rg -n "lastUpdatedAt|subscriptions|deckOnChange|cardOnChange|removeFromLocal|config\\.uid|config\\.isAnonymous|config\\.displayName" src --glob "!src/store/migrations.ts" --glob "!**/*.spec.*"

Expected: no runtime legacy hits. Test fixtures may mention removed fields only when testing migration input.

- [ ] **Step 5: Verify and commit**

    COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/store/migrations.spec.ts src/store/reducer.spec.ts src/query src/features

Expected: PASS.

    git add -A src e2e
    git commit -m "refactor: remove remote Redux compatibility"

## Task 26: Update architecture docs and Issue status

**Files:**

- Modify: docs/architecture.md
- Modify: docs/summary/architecture.md
- Modify: docs/summary/module-map.md
- Modify: docs/summary/testing.md
- Modify: docs/summary/use-cases.md
- Modify: docs/feature-list.md

- [ ] **Step 1: Update documentation**

Document:

- Query as the sole remote client cache;
- Zustand study/UI ownership;
- local-only Redux persistence;
- exact UID query keys;
- initial fetch plus first-snapshot replacement;
- generation cleanup/reconnect lifecycle;
- mutation queue, optimistic rollback, and bulk partial-failure refetch;
- test QueryClient and Firestore emulator patterns.

- [ ] **Step 2: Run the final gate**

    make ci

Expected: PASS.

- [ ] **Step 3: Update Issue #170 final status**

The issue plan is improved before implementation begins. After the final gate passes, add PR links/status and mark only verified acceptance items.

- [ ] **Step 4: Commit**

    git add docs
    git commit -m "docs: describe final state ownership"

---

## Phase acceptance checklist

### Phase 1

- [ ] deckId selection remains route-owned.
- [ ] currentIndex/cardOrderIds are Zustand session state only.
- [ ] showBackText/autoPlay/lastSwipe are non-persisted Zustand UI state.
- [ ] legacy session imports once without a Firestore thunk.
- [ ] Firestore writes exclude all client-only fields.
- [ ] local-mode E2E and make ci pass.

### Phase 2

- [ ] Query keys are UID-scoped and remote maps are normalized.
- [ ] live Firebase UID, never persisted UID, starts fetch/listeners.
- [ ] first snapshot fully reconciles Query and Redux mirror.
- [ ] UID switch ignores delayed work and removes old cache/listeners.
- [ ] one listener pair fans out to Query and the compatibility mirror.
- [ ] all containers read the merged Query/local model.
- [ ] make ci passes.

### Phase 3

- [ ] card create/update/delete/bulk operations are awaited Query mutations.
- [ ] local card mutations touch Redux only.
- [ ] same-card operations serialize; different cards can run concurrently.
- [ ] mutation errors rollback and remain visible at the operation.
- [ ] failed swipe restores both card and index.
- [ ] all swipe inputs are blocked while pending.
- [ ] make ci passes.

### Phase 4

- [ ] deck create/update/delete and workflows use Query-aware hooks.
- [ ] failed deck delete restores deck and child cards.
- [ ] deck delete cannot race with child-card rollback.
- [ ] download/import/reimport read the merged model.
- [ ] no mutation compatibility bridge remains.
- [ ] make ci passes.

### Phase 5

- [ ] Redux contains and persists localMode entities only.
- [ ] persisted auth snapshot and lastUpdatedAt are gone.
- [ ] Query is the only remote entity cache.
- [ ] the legacy action/event lifecycle is gone.
- [ ] settings read runtime AuthContext.
- [ ] docs and Issue #170 show verified PR/status links.
- [ ] make ci passes.
