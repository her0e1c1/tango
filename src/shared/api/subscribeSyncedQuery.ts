import { onSnapshot, type DocumentData, type Query, type QuerySnapshot } from "firebase/firestore";
import { firestoreTimestampSchema } from "./firestoreDocument";
import { compareSyncTimestamps, type SyncCheckpoint, type SyncState, type SyncTimestamp } from "./syncPersistence";

export interface SyncedQueryResult<T> {
  values: T[];
  fromCache: boolean;
  hasPendingWrites: boolean;
  checkpoint?: SyncCheckpoint | null;
}

interface SyncStore {
  getState: () => SyncState;
  persist: { hasHydrated: () => boolean; rehydrate: () => void | Promise<void> };
}

interface SyncedQueryOptions<T> {
  scope: string;
  store: SyncStore;
  request: (cursor: SyncTimestamp | null) => Query;
  parse: (id: string, data: DocumentData) => T;
  receive: (result: SyncedQueryResult<T>) => unknown;
  onError: (error: Error) => void;
  source?: "cache" | "default";
  // Bounded views need a server boundary captured before their initial result.
  bootstrap?: { boundary: Query; initial: Query };
  retain?: (documents: Record<string, DocumentData>) => Record<string, DocumentData>;
}

interface SyncChange<T> {
  data: DocumentData;
  value: T;
  pending: boolean;
}

function timestamp(data: DocumentData): SyncTimestamp {
  const value = firestoreTimestampSchema.parse(data.updatedAt);
  return { seconds: value.seconds, nanoseconds: value.nanoseconds };
}

const hydrations = new WeakMap<SyncStore, Promise<void>>();

async function hydrateStore(store: SyncStore) {
  if (store.persist.hasHydrated()) return;
  let hydration = hydrations.get(store);
  if (!hydration) {
    hydration = Promise.resolve(store.persist.rehydrate()).finally(() => hydrations.delete(store));
    hydrations.set(store, hydration);
  }
  await hydration;
}

function readChanges<T>(
  snapshot: QuerySnapshot,
  changes: Map<string, SyncChange<T>>,
  invalid: Map<string, unknown>,
  parse: SyncedQueryOptions<T>["parse"]
) {
  for (const change of snapshot.docChanges({ includeMetadataChanges: true })) {
    const id = change.doc.id;
    invalid.delete(id);
    if (change.type === "removed") {
      changes.delete(id);
      continue;
    }
    try {
      const data = change.doc.data({ serverTimestamps: "estimate" });
      timestamp(data);
      changes.set(id, { data, value: parse(id, data), pending: change.doc.metadata.hasPendingWrites });
    } catch (error) {
      invalid.set(id, error);
    }
  }
}

function mergeChanges<T>(base: SyncCheckpoint, baseValues: Map<string, T>, changes: Map<string, SyncChange<T>>) {
  const values = new Map(baseValues);
  const documents = new Map(Object.entries(base.documents));
  let lastUpdatedAt = base.lastUpdatedAt;
  for (const [id, change] of changes) {
    const previous = documents.get(id);
    const updatedAt = timestamp(change.data);
    if (!change.pending && previous && compareSyncTimestamps(updatedAt, timestamp(previous)) < 0) continue;
    values.set(id, change.value);
    documents.set(id, change.data);
    if (!change.pending && (lastUpdatedAt === null || compareSyncTimestamps(updatedAt, lastUpdatedAt) > 0))
      lastUpdatedAt = updatedAt;
  }
  return { values, documents: Object.fromEntries(documents), lastUpdatedAt };
}

function shouldRestartQuery({
  confirmed,
  initial,
  cursor,
  latest,
  becameOffline,
}: {
  confirmed: boolean;
  initial: boolean;
  cursor: SyncTimestamp | null;
  latest: SyncTimestamp | null;
  becameOffline: boolean;
}) {
  if (confirmed && initial) return true;
  if (latest === null || (cursor !== null && compareSyncTimestamps(latest, cursor) <= 0)) return false;
  return (confirmed && cursor === null) || becameOffline;
}

/** Mirrors snapshot changes; writes and retries remain entirely in the Firestore SDK. */
export function subscribeSyncedQuery<T>(options: SyncedQueryOptions<T>): () => void {
  let active = true;
  const isActive = () => active;
  let generation = 0;
  let stop: () => void = () => undefined;
  let stopBootstrap: () => void = () => undefined;
  let base: SyncCheckpoint = { documents: {}, lastUpdatedAt: null, documentCount: 0 };
  let baseValues = new Map<string, T>();
  let initialized = false;
  const fail = (cause: unknown) => {
    if (active) options.onError(cause instanceof Error ? cause : new Error(String(cause)));
  };
  const publish = (result: SyncedQueryResult<T>) => {
    if (!isActive()) return;
    try {
      void Promise.resolve(options.receive(result)).catch(fail);
    } catch (error) {
      fail(error);
    }
  };

  function restoreSaved() {
    const saved = options.store.getState().sync[options.scope];
    if (!saved) return;
    try {
      const values = new Map<string, T>();
      for (const [id, data] of Object.entries(saved.documents)) {
        timestamp(data);
        values.set(id, options.parse(id, data));
      }
      base = saved;
      baseValues = values;
      initialized = true;
      publish({ values: [...values.values()], fromCache: true, hasPendingWrites: false });
    } catch {
      publish({ values: [], fromCache: true, hasPendingWrites: false, checkpoint: null });
    }
  }

  function confirm(merged: ReturnType<typeof mergeChanges<T>>, boundary?: SyncTimestamp | null) {
    const documents = options.retain?.(merged.documents) ?? merged.documents;
    base = {
      documents,
      lastUpdatedAt: boundary === undefined ? merged.lastUpdatedAt : boundary,
      documentCount: Object.keys(documents).length,
    };
    baseValues = new Map([...merged.values].filter(([id]) => Object.hasOwn(documents, id)));
    initialized = true;
    return base;
  }

  function ingest(
    snapshot: QuerySnapshot,
    changes: Map<string, SyncChange<T>>,
    invalid: Map<string, unknown>,
    bootstrapBoundary?: SyncTimestamp | null
  ) {
    readChanges(snapshot, changes, invalid, options.parse);
    if (invalid.size > 0) {
      fail(invalid.values().next().value);
      return;
    }
    const merged = mergeChanges(base, baseValues, changes);
    const confirmed = !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites;
    const checkpoint = confirmed ? confirm(merged, bootstrapBoundary) : undefined;
    publish({
      values: [...merged.values.values()],
      fromCache: snapshot.metadata.fromCache || bootstrapBoundary !== undefined,
      hasPendingWrites: snapshot.metadata.hasPendingWrites,
      ...(checkpoint ? { checkpoint } : {}),
    });
    return confirmed;
  }

  function listen(cursor: SyncTimestamp | null, initialRequest?: Query, boundary?: SyncTimestamp | null) {
    generation += 1;
    const current = generation;
    stop();
    const changes = new Map<string, SyncChange<T>>();
    const invalid = new Map<string, unknown>();
    let sawServer = false;
    const isCurrent = () => isActive() && current === generation;
    const receive = (snapshot: QuerySnapshot) => {
      if (!isCurrent()) return;
      const confirmed = ingest(snapshot, changes, invalid, initialRequest ? (boundary ?? null) : undefined);
      if (!isCurrent() || confirmed === undefined) return;
      const becameOffline = snapshot.metadata.fromCache && sawServer;
      if (
        shouldRestartQuery({
          confirmed,
          initial: initialRequest !== undefined,
          cursor,
          latest: base.lastUpdatedAt,
          becameOffline,
        })
      ) {
        // Data and cursor form one durable pair. Reconnect from the latest complete position.
        listen(base.lastUpdatedAt);
      }
      sawServer ||= !snapshot.metadata.fromCache;
    };
    stop = onSnapshot(
      initialRequest ?? options.request(cursor),
      { includeMetadataChanges: true, source: options.source ?? "default" },
      receive,
      (error) => {
        if (current === generation) fail(error);
      }
    );
  }

  function bootstrap(requests: NonNullable<SyncedQueryOptions<T>["bootstrap"]>) {
    generation += 1;
    const current = generation;
    const isCurrent = () => active && current === generation;
    const onError = (error: Error) => {
      if (isCurrent()) fail(error);
    };
    // The cache-only view preserves offline startup while the boundary is unavailable.
    stop = onSnapshot(
      requests.initial,
      { includeMetadataChanges: true, source: "cache" },
      (snapshot) => {
        if (!isCurrent()) return;
        try {
          publish({
            values: snapshot.docs.map((document) =>
              options.parse(document.id, document.data({ serverTimestamps: "estimate" }))
            ),
            fromCache: true,
            hasPendingWrites: snapshot.metadata.hasPendingWrites,
          });
        } catch (error) {
          fail(error);
        }
      },
      onError
    );
    stopBootstrap = onSnapshot(
      requests.boundary,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!isCurrent() || snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
        try {
          const boundary = snapshot.docs[0] ? timestamp(snapshot.docs[0].data()) : null;
          stopBootstrap();
          listen(null, requests.initial, boundary);
        } catch (error) {
          fail(error);
        }
      },
      onError
    );
  }

  async function start() {
    await hydrateStore(options.store);
    if (!isActive()) return;
    restoreSaved();
    if (!isActive()) return;
    if (!initialized && options.bootstrap && options.source !== "cache") bootstrap(options.bootstrap);
    else listen(base.lastUpdatedAt, !initialized ? options.bootstrap?.initial : undefined);
  }
  void start().catch(fail);
  return () => {
    active = false;
    generation += 1;
    stop();
    stopBootstrap();
  };
}
