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
  readonly size: number;
  readonly fromCache: boolean;
  readonly hasPendingWrites: boolean;
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

interface CurrentRemoteSnapshot {
  state: RemoteState;
  metadata: ReadonlyMap<RemoteCollectionName, RemoteSnapshotMetadata>;
}

const emptyData = (): RemoteData => ({ decksById: {}, cardsById: {} });
const emptyMetadata = (): ReadonlyMap<RemoteCollectionName, RemoteSnapshotMetadata> => new Map();

export const createRemoteStore = (): RemoteStore => {
  let current: CurrentRemoteSnapshot = {
    state: { uid: null, status: "idle", ...emptyData() },
    metadata: emptyMetadata(),
  };
  const listeners = new Set<Callback>();

  const publish = (next: CurrentRemoteSnapshot) => {
    current = next;
    listeners.forEach((listener) => {
      listener();
    });
  };

  const getSnapshot = () => current.state;

  const subscribe = (listener: Callback) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const read: RemoteStore["read"] = (uid, collection) => {
    const state = current.state;
    if (state.uid !== uid) return {};
    return (collection === "decks" ? state.decksById : state.cardsById) as never;
  };

  const replace: RemoteStore["replace"] = (uid, collection, next) => {
    const state = current.state;
    if (state.uid !== uid) return;
    publish({
      state: {
        ...state,
        ...(collection === "decks" ? { decksById: next as RemoteById<Deck> } : { cardsById: next as RemoteById<Card> }),
      },
      metadata: current.metadata,
    });
  };

  const begin = (uid: string) => {
    const state = current.state;
    const data = state.uid === uid ? { decksById: state.decksById, cardsById: state.cardsById } : emptyData();
    publish({ state: { uid, status: "loading", ...data }, metadata: emptyMetadata() });
  };

  const applySnapshot: RemoteStore["applySnapshot"] = (uid, collection, snapshot) => {
    const state = current.state;
    if (state.uid !== uid) return;

    const metadata = new Map(current.metadata);
    metadata.set(collection, Object.freeze({ ...snapshot.metadata }));
    const data: RemoteData =
      collection === "decks"
        ? { decksById: snapshot.data as RemoteById<Deck>, cardsById: state.cardsById }
        : { decksById: state.decksById, cardsById: snapshot.data as RemoteById<Card> };
    const deckMetadata = metadata.get("decks");
    const cardMetadata = metadata.get("cards");
    if (!deckMetadata || !cardMetadata) {
      publish({ state: { uid, status: "loading", ...data }, metadata });
      return;
    }

    const latestMetadata = [deckMetadata, cardMetadata];
    const syncStatus = latestMetadata.some((value) => value.hasPendingWrites)
      ? "pending"
      : latestMetadata.some((value) => value.fromCache)
        ? "cached"
        : "synced";
    publish({ state: { uid, status: "ready", syncStatus, ...data }, metadata });
  };

  const fail = (uid: string, error: Error) => {
    const state = current.state;
    if (state.uid !== uid) return;
    publish({
      state: { uid, status: "error", error, decksById: state.decksById, cardsById: state.cardsById },
      metadata: current.metadata,
    });
  };

  const clear = (uid?: string) => {
    const state = current.state;
    if (uid && state.uid !== uid) return;
    publish({ state: { uid: null, status: "idle", ...emptyData() }, metadata: emptyMetadata() });
  };

  return { getSnapshot, subscribe, read, replace, begin, applySnapshot, fail, clear };
};

export const remoteStore = createRemoteStore();
