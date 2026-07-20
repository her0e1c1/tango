export type RemoteById<T> = Record<string, T | undefined>;

export const toRemoteById = <T extends { id: string }>(items: T[]): RemoteById<T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

export interface RemoteCollectionTypes {
  decks: Deck;
  cards: Card;
}

export type RemoteCollectionName = keyof RemoteCollectionTypes;
export type RemoteSyncStatus = "cached" | "pending" | "synced";

interface RemoteSnapshotMetadata {
  size: number;
  fromCache: boolean;
  hasPendingWrites: boolean;
}

interface RemoteData {
  decksById: RemoteById<Deck>;
  cardsById: RemoteById<Card>;
}

export type RemoteState = RemoteData &
  (
    | { uid: null; status: "idle" }
    | { uid: string; status: "loading" }
    | { uid: string; status: "ready"; syncStatus: RemoteSyncStatus }
    | { uid: string; status: "error"; error: Error }
  );

export interface RemoteCollectionSnapshot<T> {
  data: RemoteById<T>;
  metadata: RemoteSnapshotMetadata;
}

export interface RemoteStore {
  getSnapshot: () => RemoteState;
  subscribe: (listener: Callback) => Callback;
  read: <Collection extends RemoteCollectionName>(
    uid: string,
    collection: Collection
  ) => RemoteById<RemoteCollectionTypes[Collection]>;
  replace: <Collection extends RemoteCollectionName>(
    uid: string,
    collection: Collection,
    next: RemoteById<RemoteCollectionTypes[Collection]>
  ) => void;
  begin: (uid: string) => void;
  applySnapshot: <Collection extends RemoteCollectionName>(
    uid: string,
    collection: Collection,
    snapshot: RemoteCollectionSnapshot<RemoteCollectionTypes[Collection]>
  ) => void;
  fail: (uid: string, error: Error) => void;
  clear: (uid?: string) => void;
}

const emptyData = (): RemoteData => ({ decksById: {}, cardsById: {} });

export const createRemoteStore = (): RemoteStore => {
  let state: RemoteState = { uid: null, status: "idle", ...emptyData() };
  let metadata = new Map<RemoteCollectionName, RemoteSnapshotMetadata>();
  const listeners = new Set<Callback>();

  const publish = (next: RemoteState) => {
    state = next;
    listeners.forEach((listener) => {
      listener();
    });
  };

  const getSnapshot = () => state;

  const subscribe = (listener: Callback) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const read: RemoteStore["read"] = (uid, collection) => {
    if (state.uid !== uid) return {};
    return (collection === "decks" ? state.decksById : state.cardsById) as never;
  };

  const replace: RemoteStore["replace"] = (uid, collection, next) => {
    if (state.uid !== uid) return;
    publish({
      ...state,
      ...(collection === "decks" ? { decksById: next as RemoteById<Deck> } : { cardsById: next as RemoteById<Card> }),
    });
  };

  const begin = (uid: string) => {
    const data = state.uid === uid ? { decksById: state.decksById, cardsById: state.cardsById } : emptyData();
    metadata = new Map();
    publish({ uid, status: "loading", ...data });
  };

  const applySnapshot: RemoteStore["applySnapshot"] = (uid, collection, snapshot) => {
    if (state.uid !== uid) return;

    metadata.set(collection, snapshot.metadata);
    const data: RemoteData =
      collection === "decks"
        ? { decksById: snapshot.data as RemoteById<Deck>, cardsById: state.cardsById }
        : { decksById: state.decksById, cardsById: snapshot.data as RemoteById<Card> };
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

  const fail = (uid: string, error: Error) => {
    if (state.uid !== uid) return;
    publish({ uid, status: "error", error, decksById: state.decksById, cardsById: state.cardsById });
  };

  const clear = (uid?: string) => {
    if (uid && state.uid !== uid) return;
    metadata = new Map();
    publish({ uid: null, status: "idle", ...emptyData() });
  };

  return { getSnapshot, subscribe, read, replace, begin, applySnapshot, fail, clear };
};

export const remoteStore = createRemoteStore();
