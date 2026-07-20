export type RemoteById<T> = Readonly<Record<string, T | undefined>>;

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
  readonly decksById: RemoteById<Deck>;
  readonly cardsById: RemoteById<Card>;
}

export type RemoteState = RemoteData &
  (
    | { readonly uid: null; readonly status: "idle" }
    | { readonly uid: string; readonly status: "loading" }
    | { readonly uid: string; readonly status: "ready"; readonly syncStatus: RemoteSyncStatus }
    | { readonly uid: string; readonly status: "error"; readonly error: Error }
  );

export interface RemoteCollectionSnapshot<T> {
  readonly data: RemoteById<T>;
  readonly metadata: RemoteSnapshotMetadata;
}

export interface RemoteStore {
  getSnapshot: () => RemoteState;
  subscribe: (listener: Callback) => Callback;
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
const emptyMetadata = (): ReadonlyMap<RemoteCollectionName, RemoteSnapshotMetadata> => new Map();

export const createRemoteStore = (): RemoteStore => {
  let current: CurrentRemoteSnapshot = {
    state: Object.freeze({ uid: null, status: "idle", ...emptyData() }),
    metadata: emptyMetadata(),
  };
  const listeners = new Set<Callback>();

  const publish = (next: CurrentRemoteSnapshot) => {
    current = { ...next, state: Object.freeze(next.state) };
    listeners.forEach((listener) => {
      listener();
    });
  };

  const getSnapshot = () => current.state;

  const subscribe = (listener: Callback) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
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
        ? { decksById: freezeCollection(snapshot.data as RemoteById<Deck>, freezeDeck), cardsById: state.cardsById }
        : { decksById: state.decksById, cardsById: freezeCollection(snapshot.data as RemoteById<Card>, freezeCard) };
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

  return { getSnapshot, subscribe, begin, applySnapshot, fail, clear };
};

export const remoteStore = createRemoteStore();
