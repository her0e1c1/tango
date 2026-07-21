import type { StoreApi } from "zustand";
import { createStore } from "zustand/vanilla";

import {
  create as createRemoteCard,
  logicalRemove as removeRemoteCard,
  update as updateRemoteCard,
  upsert as upsertRemoteCard,
} from "@/adapters/firestore/card";
import {
  create as createRemoteDeck,
  remove as removeRemoteDeck,
  update as updateRemoteDeck,
} from "@/adapters/firestore/deck";
import { subscribeCardReads, subscribeDeckReads } from "@/adapters/firestore/event";
import { type FirestoreInitializationState, waitForFirestoreInitialization } from "@/adapters/firestore/runtime";
import { applyRealtimeChange } from "@/lib/realtimeChange";
import {
  cardMutationLock,
  deckMembershipMutationLock,
  deckMutationLock,
  withDeckMembershipLocks,
  withMutationLocks,
} from "@/store/remoteMutationLocks";

export type RemoteById<T> = Readonly<Record<string, T | undefined>>;

export const toRemoteById = <T extends { id: string }>(items: T[]): RemoteById<T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

export interface RemoteCollectionTypes {
  decks: Deck;
  cards: Card;
}

export type RemoteCollectionName = keyof RemoteCollectionTypes;
export type RemoteSyncStatus = "cached" | "pending" | "synced";

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

export interface RemoteReadState {
  readonly uid: string | null;
  readonly status: "idle" | "loading" | "ready" | "error";
  readonly decksById: RemoteById<Deck>;
  readonly cardsById: RemoteById<Card>;
  readonly syncStatus?: RemoteSyncStatus;
  readonly error?: Error;
}

export interface RemoteMutationState<Id> {
  readonly uid: string | null;
  readonly pendingCounts: ReadonlyMap<Id, number>;
  readonly error: unknown;
}

export interface RemoteStoreState {
  read: RemoteReadState;
  cardMutation: RemoteMutationState<CardId>;
  deckMutation: RemoteMutationState<DeckId>;
  start: (uid: string) => Promise<void>;
  stop: (uid?: string) => void;
  retryReads: () => Promise<void>;
  createCard: (uid: string, card: Card) => Promise<void>;
  updateCard: (uid: string, card: CardEdit) => Promise<void>;
  removeCard: (uid: string, id: CardId, deckId: DeckId) => Promise<void>;
  bulkUpsertCards: (uid: string, cards: Card[]) => Promise<void>;
  retryCardMutation: (uid: string) => Promise<void>;
  createDeck: (uid: string, deck: Deck) => Promise<void>;
  updateDeck: (uid: string, deck: DeckEdit) => Promise<void>;
  removeDeck: (uid: string, deck: Deck) => Promise<boolean>;
  retryDeckMutation: (uid: string) => Promise<Deck | undefined>;
}

export interface RemoteReadDependencies {
  waitForInitialization: () => Promise<FirestoreInitializationState>;
  subscribeDecks: (props: RemoteSubscriptionProps<Deck>) => Callback;
  subscribeCards: (props: RemoteSubscriptionProps<Card>) => Callback;
  applyChange: <T extends { id: string }>(
    previous: RemoteById<T>,
    event: { added?: T[]; modified?: T[]; removed?: string[] }
  ) => RemoteById<T>;
}

export interface RemoteMutationDependencies {
  createCard: (card: Card) => Promise<string>;
  updateCard: (card: CardEdit) => Promise<void>;
  removeCard: (id: CardId) => Promise<void>;
  upsertCard: (card: Card) => Promise<string>;
  createDeck: (deck: Deck) => Promise<string>;
  updateDeck: (deck: DeckEdit) => Promise<void>;
  removeDeck: (id: DeckId, uid: string) => Promise<void>;
}

interface RemoteData {
  readonly decksById: RemoteById<Deck>;
  readonly cardsById: RemoteById<Card>;
}

const dateMutationMethods = [
  "setDate",
  "setFullYear",
  "setHours",
  "setMilliseconds",
  "setMinutes",
  "setMonth",
  "setSeconds",
  "setTime",
  "setUTCDate",
  "setUTCFullYear",
  "setUTCHours",
  "setUTCMilliseconds",
  "setUTCMinutes",
  "setUTCMonth",
  "setUTCSeconds",
  "setYear",
] as const;

const freezeDate = (value: Date): Date => {
  const copy = new Date(value.getTime());
  dateMutationMethods.forEach((method) => {
    Object.defineProperty(copy, method, {
      value: () => {
        throw new TypeError("Published Date values are immutable");
      },
    });
  });
  return Object.freeze(copy);
};

const freezeDeck = (deck: Deck): Deck =>
  Object.freeze({ ...deck, selectedTags: Object.freeze([...deck.selectedTags]) }) as Deck;

const freezeCard = (card: Card): Card =>
  Object.freeze({
    ...card,
    tags: Object.freeze([...card.tags]),
    nextSeeingAt: card.nextSeeingAt == null ? card.nextSeeingAt : freezeDate(card.nextSeeingAt),
  }) as Card;

const freezeCollection = <T>(collection: RemoteById<T>, freezeEntity: (entity: T) => T): RemoteById<T> => {
  const copy: Record<string, T | undefined> = {};
  Object.entries(collection).forEach(([id, entity]) => {
    copy[id] = entity == null ? undefined : freezeEntity(entity);
  });
  return Object.freeze(copy);
};

const emptyData = (): RemoteData => ({
  decksById: freezeCollection({}, freezeDeck),
  cardsById: freezeCollection({}, freezeCard),
});

const idleReadState = (): RemoteReadState => Object.freeze({ uid: null, status: "idle", ...emptyData() });

const idleMutationState = <Id>(uid: string | null = null): RemoteMutationState<Id> =>
  Object.freeze({ uid, pendingCounts: new Map<Id, number>(), error: null });

type CardMutationVariables =
  | { kind: "create"; card: Card }
  | { kind: "update"; card: CardEdit }
  | { kind: "remove"; id: CardId; deckId: DeckId }
  | { kind: "bulkUpsert"; cards: Card[] };

interface CardMutationFailure {
  variables: CardMutationVariables;
  error: unknown;
  sequence: number;
}

type DeckMutationVariables =
  | { kind: "create"; deck: Deck }
  | { kind: "update"; deck: DeckEdit }
  | { kind: "remove"; deck: Deck };

interface DeckMutationFailure {
  variables: DeckMutationVariables;
  error: unknown;
  sequence: number;
}

interface InFlightDeckRemoval {
  generation: number;
  operation: Promise<void>;
}

export class CardBulkMutationError extends Error {
  constructor(
    public readonly failedIds: CardId[],
    total: number,
    options?: ErrorOptions
  ) {
    super(`${failedIds.length} of ${total} Card writes failed`, options);
  }
}

const cardMutationIds = (variables: CardMutationVariables): CardId[] => {
  if (variables.kind === "remove") return [variables.id];
  if (variables.kind === "bulkUpsert") return variables.cards.map((card) => card.id);
  return [variables.card.id];
};

const sameCardMutation = (left: CardMutationVariables, right: CardMutationVariables) => {
  if (left.kind !== right.kind) return false;
  const leftIds = cardMutationIds(left).sort();
  const rightIds = cardMutationIds(right).sort();
  return leftIds.length === rightIds.length && leftIds.every((id, index) => id === rightIds[index]);
};

const sameDeckMutation = (left: DeckMutationVariables, right: DeckMutationVariables) =>
  left.kind === right.kind && left.deck.id === right.deck.id;

const readCollection = <Collection extends RemoteCollectionName>(
  state: RemoteReadState,
  collection: Collection
): RemoteById<RemoteCollectionTypes[Collection]> =>
  (collection === "decks" ? state.decksById : state.cardsById) as RemoteById<RemoteCollectionTypes[Collection]>;

export const createRemoteStore = (
  dependencies: RemoteReadDependencies & Partial<RemoteMutationDependencies>
): StoreApi<RemoteStoreState> => {
  let requestedUid: string | undefined;
  let activeUid: string | undefined;
  let generation = 0;
  let metadata = new Map<RemoteCollectionName, RemoteSnapshotMetadata>();
  let automaticRecoveries = 0;
  let unsubscribeDeck: Callback | undefined;
  let unsubscribeCard: Callback | undefined;
  let currentStart: Promise<void> | undefined;
  let currentStartUid: string | undefined;
  let cardMutationGeneration = 0;
  let cardMutationSequence = 0;
  let cardMutationFailure: CardMutationFailure | undefined;
  let deckMutationGeneration = 0;
  let deckMutationSequence = 0;
  let deckMutationFailure: DeckMutationFailure | undefined;
  const inFlightDeckRemovals = new Map<string, InFlightDeckRemoval>();

  const isCurrent = (uid: string, currentGeneration: number) => activeUid === uid && generation === currentGeneration;

  const stopListener = (unsubscribe: Callback | undefined) => {
    try {
      unsubscribe?.();
    } catch {
      // Listener cleanup is best-effort.
    }
  };

  const stopListeners = () => {
    const subscriptions = [unsubscribeDeck, unsubscribeCard];
    unsubscribeDeck = undefined;
    unsubscribeCard = undefined;
    subscriptions.forEach(stopListener);
  };

  const store = createStore<RemoteStoreState>()((set, get) => {
    const publish = (read: RemoteReadState) => set({ read: Object.freeze(read) });

    const publishCardMutation = (state: RemoteMutationState<CardId>) => set({ cardMutation: Object.freeze(state) });

    const resetCardMutation = (uid: string | null) => {
      if (get().cardMutation.uid === uid) return;
      cardMutationGeneration += 1;
      cardMutationFailure = undefined;
      return idleMutationState<CardId>(uid);
    };

    const prepareCardMutation = (uid: string) => {
      const next = resetCardMutation(uid);
      if (next != null) publishCardMutation(next);
      return cardMutationGeneration;
    };

    const updateCardPending = (ids: CardId[], delta: 1 | -1) => {
      const current = get().cardMutation;
      const pendingCounts = new Map(current.pendingCounts);
      ids.forEach((id) => {
        const count = (pendingCounts.get(id) ?? 0) + delta;
        if (count === 0) pendingCounts.delete(id);
        else pendingCounts.set(id, count);
      });
      publishCardMutation({ ...current, pendingCounts });
    };

    const runCardMutation = async (uid: string, variables: CardMutationVariables, task: () => Promise<void>) => {
      const operationGeneration = prepareCardMutation(uid);
      const sequence = ++cardMutationSequence;
      const ids = cardMutationIds(variables);
      updateCardPending(ids, 1);
      try {
        if (uid === "") throw new Error("A confirmed user is required for remote Card writes");
        await task();
        if (cardMutationGeneration !== operationGeneration) return;
        const failure = cardMutationFailure;
        if (failure != null && failure.sequence < sequence && sameCardMutation(failure.variables, variables)) {
          cardMutationFailure = undefined;
          publishCardMutation({ ...get().cardMutation, error: null });
        }
      } catch (error) {
        if (cardMutationGeneration === operationGeneration) {
          cardMutationFailure = { variables, error, sequence };
          publishCardMutation({ ...get().cardMutation, error });
        }
        throw error;
      } finally {
        if (cardMutationGeneration === operationGeneration) updateCardPending(ids, -1);
      }
    };

    const createCard = (uid: string, card: Card) =>
      runCardMutation(uid, { kind: "create", card }, () =>
        withMutationLocks([cardMutationLock(uid, card.id)], () =>
          withDeckMembershipLocks([deckMembershipMutationLock(uid, card.deckId)], "shared", async () => {
            const create = dependencies.createCard;
            if (create == null) throw new Error("Remote Card create dependency is unavailable");
            await create(card);
          })
        )
      );

    const updateCard = (uid: string, card: CardEdit) =>
      runCardMutation(uid, { kind: "update", card }, () =>
        withMutationLocks([cardMutationLock(uid, card.id)], () =>
          withDeckMembershipLocks([deckMembershipMutationLock(uid, card.deckId)], "shared", async () => {
            const update = dependencies.updateCard;
            if (update == null) throw new Error("Remote Card update dependency is unavailable");
            await update(card);
          })
        )
      );

    const removeCard = (uid: string, id: CardId, deckId: DeckId) =>
      runCardMutation(uid, { kind: "remove", id, deckId }, () =>
        withMutationLocks([cardMutationLock(uid, id)], () =>
          withDeckMembershipLocks([deckMembershipMutationLock(uid, deckId)], "shared", async () => {
            const remove = dependencies.removeCard;
            if (remove == null) throw new Error("Remote Card remove dependency is unavailable");
            await remove(id);
          })
        )
      );

    const bulkUpsertCards = (uid: string, cards: Card[]) =>
      runCardMutation(uid, { kind: "bulkUpsert", cards }, () =>
        withMutationLocks(
          cards.map((card) => cardMutationLock(uid, card.id)),
          () =>
            withDeckMembershipLocks(
              cards.map((card) => deckMembershipMutationLock(uid, card.deckId)),
              "shared",
              async () => {
                const upsert = dependencies.upsertCard;
                if (upsert == null) throw new Error("Remote Card upsert dependency is unavailable");
                const results = await Promise.allSettled(cards.map((card) => upsert(card)));
                const failedIds = results.flatMap((result, index) => {
                  const card = cards[index];
                  return result.status === "rejected" && card != null ? [card.id] : [];
                });
                if (failedIds.length > 0) throw new CardBulkMutationError(failedIds, cards.length);
              }
            )
        )
      );

    const retryCardMutation = (uid: string) => {
      if (uid === "") return Promise.reject(new Error("A confirmed user is required for remote Card writes"));
      if (get().cardMutation.uid !== uid) prepareCardMutation(uid);
      const failure = cardMutationFailure;
      if (failure == null) return Promise.resolve();
      const variables = failure.variables;
      if (variables.kind === "create") return createCard(uid, variables.card);
      if (variables.kind === "update") return updateCard(uid, variables.card);
      if (variables.kind === "remove") return removeCard(uid, variables.id, variables.deckId);
      return bulkUpsertCards(uid, variables.cards);
    };

    const publishDeckMutation = (state: RemoteMutationState<DeckId>) => set({ deckMutation: Object.freeze(state) });

    const resetDeckMutation = (uid: string | null) => {
      if (get().deckMutation.uid === uid) return;
      deckMutationGeneration += 1;
      deckMutationFailure = undefined;
      return idleMutationState<DeckId>(uid);
    };

    const prepareDeckMutation = (uid: string) => {
      const next = resetDeckMutation(uid);
      if (next != null) publishDeckMutation(next);
      return deckMutationGeneration;
    };

    const updateDeckPending = (id: DeckId, delta: 1 | -1) => {
      const current = get().deckMutation;
      const pendingCounts = new Map(current.pendingCounts);
      const count = (pendingCounts.get(id) ?? 0) + delta;
      if (count === 0) pendingCounts.delete(id);
      else pendingCounts.set(id, count);
      publishDeckMutation({ ...current, pendingCounts });
    };

    const runDeckMutation = async (uid: string, variables: DeckMutationVariables, task: () => Promise<void>) => {
      const operationGeneration = prepareDeckMutation(uid);
      const sequence = ++deckMutationSequence;
      const deckId = variables.deck.id;
      updateDeckPending(deckId, 1);
      try {
        if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
        await task();
        if (deckMutationGeneration !== operationGeneration) return;
        const failure = deckMutationFailure;
        if (failure != null && failure.sequence < sequence && sameDeckMutation(failure.variables, variables)) {
          deckMutationFailure = undefined;
          publishDeckMutation({ ...get().deckMutation, error: null });
        }
      } catch (error) {
        if (deckMutationGeneration === operationGeneration) {
          deckMutationFailure = { variables, error, sequence };
          publishDeckMutation({ ...get().deckMutation, error });
        }
        throw error;
      } finally {
        if (deckMutationGeneration === operationGeneration) updateDeckPending(deckId, -1);
      }
    };

    const createDeck = (uid: string, deck: Deck) =>
      runDeckMutation(uid, { kind: "create", deck }, () =>
        withMutationLocks([deckMutationLock(uid, deck.id)], async () => {
          const create = dependencies.createDeck;
          if (create == null) throw new Error("Remote Deck create dependency is unavailable");
          await create(deck);
        })
      );

    const updateDeck = (uid: string, deck: DeckEdit) =>
      runDeckMutation(uid, { kind: "update", deck }, () =>
        withMutationLocks([deckMutationLock(uid, deck.id)], async () => {
          const update = dependencies.updateDeck;
          if (update == null) throw new Error("Remote Deck update dependency is unavailable");
          await update(deck);
        })
      );

    const removeDeck = (uid: string, deck: Deck): Promise<boolean> => {
      const key = deckMutationLock(uid, deck.id);
      const operationGeneration = prepareDeckMutation(uid);
      const currentRemoval = inFlightDeckRemovals.get(key);
      if (currentRemoval?.generation === operationGeneration) return currentRemoval.operation.then(() => false);

      const operation = runDeckMutation(uid, { kind: "remove", deck }, () =>
        withMutationLocks([key], () =>
          withDeckMembershipLocks([deckMembershipMutationLock(uid, deck.id)], "exclusive", async () => {
            const remove = dependencies.removeDeck;
            if (remove == null) throw new Error("Remote Deck remove dependency is unavailable");
            await remove(deck.id, uid);
          })
        )
      );
      let entry: InFlightDeckRemoval;
      const shared = operation.then(
        () => {
          if (inFlightDeckRemovals.get(key) === entry) inFlightDeckRemovals.delete(key);
        },
        (error: unknown) => {
          if (inFlightDeckRemovals.get(key) === entry) inFlightDeckRemovals.delete(key);
          throw error;
        }
      );
      entry = { generation: operationGeneration, operation: shared };
      inFlightDeckRemovals.set(key, entry);
      return shared.then(() => deckMutationGeneration === operationGeneration);
    };

    const retryDeckMutation = async (uid: string): Promise<Deck | undefined> => {
      if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
      const operationGeneration = prepareDeckMutation(uid);
      const failure = deckMutationFailure;
      if (failure == null) return;
      const variables = failure.variables;
      if (variables.kind === "create") {
        await createDeck(uid, variables.deck);
        return;
      }
      if (variables.kind === "update") {
        await updateDeck(uid, variables.deck);
        return;
      }

      const key = deckMutationLock(uid, variables.deck.id);
      const currentRemoval = inFlightDeckRemovals.get(key);
      if (currentRemoval?.generation === operationGeneration) {
        try {
          await currentRemoval.operation;
        } catch {
          return;
        }
        if (deckMutationGeneration !== operationGeneration || deckMutationFailure !== failure) return;
      }
      const ownsSuccess = await removeDeck(uid, variables.deck);
      return ownsSuccess && deckMutationGeneration === operationGeneration ? variables.deck : undefined;
    };

    const beginRead = (uid: string) => {
      const read = get().read;
      const data = read.uid === uid ? { decksById: read.decksById, cardsById: read.cardsById } : emptyData();
      const cardMutation = resetCardMutation(uid);
      const deckMutation = resetDeckMutation(uid);
      metadata = new Map();
      set({
        read: Object.freeze({ uid, status: "loading", ...data }),
        ...(cardMutation == null ? {} : { cardMutation }),
        ...(deckMutation == null ? {} : { deckMutation }),
      });
    };

    const publishFailure = (uid: string, error: Error) => {
      const read = get().read;
      if (read.uid !== uid) return;
      publish({ uid, status: "error", error, decksById: read.decksById, cardsById: read.cardsById });
    };

    const applySnapshot = <Collection extends RemoteCollectionName>(
      uid: string,
      currentGeneration: number,
      collection: Collection,
      snapshot: RemoteSnapshot<RemoteCollectionTypes[Collection]>
    ) => {
      if (!isCurrent(uid, currentGeneration)) return;
      const read = get().read;
      const previous = readCollection(read, collection);
      const next =
        snapshot.type === "replace" ? toRemoteById(snapshot.items) : dependencies.applyChange(previous, snapshot.event);
      const nextMetadata = new Map(metadata);
      nextMetadata.set(collection, Object.freeze({ ...snapshot.metadata }));
      metadata = nextMetadata;

      const data: RemoteData =
        collection === "decks"
          ? { decksById: freezeCollection(next as RemoteById<Deck>, freezeDeck), cardsById: read.cardsById }
          : { decksById: read.decksById, cardsById: freezeCollection(next as RemoteById<Card>, freezeCard) };
      const deckMetadata = metadata.get("decks");
      const cardMetadata = metadata.get("cards");
      if (!deckMetadata || !cardMetadata) {
        publish({ uid, status: "loading", ...data });
        return;
      }

      const latestMetadata = [deckMetadata, cardMetadata];
      const syncStatus = latestMetadata.some((value) => value.hasPendingWrites)
        ? "pending"
        : latestMetadata.some((value) => value.fromCache)
          ? "cached"
          : "synced";
      publish({ uid, status: "ready", syncStatus, ...data });
    };

    const handleListenerError = (uid: string, currentGeneration: number, error: Error) => {
      if (!isCurrent(uid, currentGeneration)) return;
      if (automaticRecoveries >= 1) {
        generation += 1;
        stopListeners();
        publishFailure(uid, error);
        return;
      }

      stopListeners();
      automaticRecoveries += 1;
      const recovery = begin(uid, false);
      currentStart = recovery;
      currentStartUid = uid;
      void recovery.catch(() => undefined);
    };

    const attachListeners = (uid: string, currentGeneration: number) => {
      const onError = (error: Error) => handleListenerError(uid, currentGeneration, error);
      const nextDeckSubscription = dependencies.subscribeDecks({
        uid,
        onSnapshot: (snapshot) => applySnapshot(uid, currentGeneration, "decks", snapshot),
        onError,
      });
      if (!isCurrent(uid, currentGeneration)) {
        stopListener(nextDeckSubscription);
        return;
      }
      unsubscribeDeck = nextDeckSubscription;

      const nextCardSubscription = dependencies.subscribeCards({
        uid,
        onSnapshot: (snapshot) => applySnapshot(uid, currentGeneration, "cards", snapshot),
        onError,
      });
      if (!isCurrent(uid, currentGeneration)) {
        stopListener(nextCardSubscription);
        return;
      }
      unsubscribeCard = nextCardSubscription;
    };

    const begin = (uid: string, resetAutomaticRecoveries: boolean): Promise<void> => {
      stopListeners();
      activeUid = uid;
      if (resetAutomaticRecoveries) automaticRecoveries = 0;
      const currentGeneration = ++generation;
      beginRead(uid);

      try {
        attachListeners(uid, currentGeneration);
        return Promise.resolve();
      } catch (error) {
        const initializationError = error instanceof Error ? error : new Error(String(error));
        const shouldPublishFailure = isCurrent(uid, currentGeneration);
        if (shouldPublishFailure) generation += 1;
        stopListeners();
        if (shouldPublishFailure) publishFailure(uid, initializationError);
        return Promise.reject(initializationError);
      }
    };

    const start = (uid: string): Promise<void> => {
      const read = get().read;
      if (
        requestedUid === uid &&
        currentStartUid === uid &&
        currentStart &&
        (activeUid !== uid || read.status === "loading" || read.status === "ready")
      ) {
        return currentStart;
      }

      requestedUid = uid;
      const starting = dependencies.waitForInitialization().then((initialization) => {
        if (initialization.status === "blocked" || requestedUid !== uid) return;
        return begin(uid, true);
      });
      currentStart = starting;
      currentStartUid = uid;
      return starting;
    };

    const stop = (uid?: string) => {
      if (uid && uid !== requestedUid && uid !== activeUid) return;

      if (!uid || requestedUid === uid) requestedUid = undefined;
      if (!uid || currentStartUid === uid) {
        currentStart = undefined;
        currentStartUid = undefined;
      }
      if (uid && uid !== activeUid) return;

      stopListeners();
      activeUid = undefined;
      generation += 1;
      const read = get().read;
      if (!uid || read.uid === uid) {
        metadata = new Map();
        const cardMutation = resetCardMutation(null);
        const deckMutation = resetDeckMutation(null);
        set({
          read: idleReadState(),
          ...(cardMutation == null ? {} : { cardMutation }),
          ...(deckMutation == null ? {} : { deckMutation }),
        });
      }
    };

    const retryReads = () => {
      if (!activeUid) return Promise.resolve();
      const retry = begin(activeUid, true);
      currentStart = retry;
      currentStartUid = activeUid;
      return retry;
    };

    return {
      read: idleReadState(),
      cardMutation: idleMutationState(),
      deckMutation: idleMutationState(),
      start,
      stop,
      retryReads,
      createCard,
      updateCard,
      removeCard,
      bulkUpsertCards,
      retryCardMutation,
      createDeck,
      updateDeck,
      removeDeck,
      retryDeckMutation,
    };
  });

  return store;
};

export const remoteStore = createRemoteStore({
  waitForInitialization: waitForFirestoreInitialization,
  subscribeDecks: subscribeDeckReads,
  subscribeCards: subscribeCardReads,
  applyChange: applyRealtimeChange,
  createCard: createRemoteCard,
  updateCard: updateRemoteCard,
  removeCard: removeRemoteCard,
  upsertCard: upsertRemoteCard,
  createDeck: createRemoteDeck,
  updateDeck: updateRemoteDeck,
  removeDeck: removeRemoteDeck,
});
