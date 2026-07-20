import type { StoreApi } from "zustand";
import { createStore } from "zustand/vanilla";

import { subscribeCardReads, subscribeDeckReads } from "@/adapters/firestore/event";
import { type FirestoreInitializationState, waitForFirestoreInitialization } from "@/adapters/firestore/runtime";
import { applyRealtimeChange } from "@/lib/realtimeChange";

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

export interface RemoteStoreState {
  read: RemoteReadState;
  start: (uid: string) => Promise<void>;
  stop: (uid?: string) => void;
  retryReads: () => Promise<void>;
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

const readCollection = <Collection extends RemoteCollectionName>(
  state: RemoteReadState,
  collection: Collection
): RemoteById<RemoteCollectionTypes[Collection]> =>
  (collection === "decks" ? state.decksById : state.cardsById) as RemoteById<RemoteCollectionTypes[Collection]>;

export const createRemoteStore = (dependencies: RemoteReadDependencies): StoreApi<RemoteStoreState> => {
  let requestedUid: string | undefined;
  let activeUid: string | undefined;
  let generation = 0;
  let metadata = new Map<RemoteCollectionName, RemoteSnapshotMetadata>();
  let automaticRecoveries = 0;
  let unsubscribeDeck: Callback | undefined;
  let unsubscribeCard: Callback | undefined;
  let currentStart: Promise<void> | undefined;
  let currentStartUid: string | undefined;

  const isCurrent = (uid: string, currentGeneration: number) => activeUid === uid && generation === currentGeneration;

  const stopListeners = () => {
    const subscriptions = [unsubscribeDeck, unsubscribeCard];
    unsubscribeDeck = undefined;
    unsubscribeCard = undefined;
    subscriptions.forEach((unsubscribe) => {
      try {
        unsubscribe?.();
      } catch {
        // Both listeners must be given a chance to stop.
      }
    });
  };

  const store = createStore<RemoteStoreState>()((set, get) => {
    const publish = (read: RemoteReadState) => set({ read: Object.freeze(read) });

    const beginRead = (uid: string) => {
      const read = get().read;
      const data = read.uid === uid ? { decksById: read.decksById, cardsById: read.cardsById } : emptyData();
      metadata = new Map();
      publish({ uid, status: "loading", ...data });
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
        unsubscribeDeck = nextDeckSubscription;
        stopListeners();
        return;
      }
      unsubscribeDeck = nextDeckSubscription;

      const nextCardSubscription = dependencies.subscribeCards({
        uid,
        onSnapshot: (snapshot) => applySnapshot(uid, currentGeneration, "cards", snapshot),
        onError,
      });
      if (!isCurrent(uid, currentGeneration)) {
        unsubscribeCard = nextCardSubscription;
        stopListeners();
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
        publish(idleReadState());
      }
    };

    const retryReads = () => {
      if (!activeUid) return Promise.resolve();
      const retry = begin(activeUid, true);
      currentStart = retry;
      currentStartUid = activeUid;
      return retry;
    };

    return { read: idleReadState(), start, stop, retryReads };
  });

  return store;
};

export const remoteStore = createRemoteStore({
  waitForInitialization: waitForFirestoreInitialization,
  subscribeDecks: subscribeDeckReads,
  subscribeCards: subscribeCardReads,
  applyChange: applyRealtimeChange,
});
