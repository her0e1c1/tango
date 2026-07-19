export interface RemoteSnapshotMetadata {
  fromCache: boolean;
  hasPendingWrites: boolean;
}

export type RemoteSyncStatus = "cached" | "pending" | "synced";

export type RemoteReadState =
  | { uid: null; status: "idle" }
  | { uid: string; status: "loading" }
  | { uid: string; status: "ready"; syncStatus: RemoteSyncStatus }
  | { uid: string; status: "error"; error: Error };

export const createSyncState = <Collection extends string>(collections: readonly Collection[]) => {
  let activeUid: string | undefined;
  let generation = 0;
  let state: RemoteReadState = { uid: null, status: "idle" };
  let metadata = new Map<Collection, RemoteSnapshotMetadata>();
  const listeners = new Set<Callback>();

  const setState = (next: RemoteReadState) => {
    state = next;
    listeners.forEach((listener) => {
      listener();
    });
  };

  const isCurrent = (uid: string, currentGeneration: number) => activeUid === uid && generation === currentGeneration;

  return {
    start: (uid: string) => {
      activeUid = uid;
      metadata = new Map();
      const currentGeneration = ++generation;
      setState({ uid, status: "loading" });
      return currentGeneration;
    },
    observe: (uid: string, currentGeneration: number, collection: Collection, nextMetadata: RemoteSnapshotMetadata) => {
      if (!isCurrent(uid, currentGeneration)) return;
      metadata.set(collection, nextMetadata);
      if (collections.some((name) => !metadata.has(name))) return;

      const snapshots = collections.map((name) => metadata.get(name) as RemoteSnapshotMetadata);
      const syncStatus = snapshots.some((snapshot) => snapshot.hasPendingWrites)
        ? "pending"
        : snapshots.some((snapshot) => snapshot.fromCache)
          ? "cached"
          : "synced";
      setState({ uid, status: "ready", syncStatus });
    },
    fail: (uid: string, currentGeneration: number, error: Error) => {
      if (isCurrent(uid, currentGeneration)) setState({ uid, status: "error", error });
    },
    stop: (uid?: string) => {
      if (uid && uid !== activeUid) return;
      activeUid = undefined;
      metadata = new Map();
      generation += 1;
      setState({ uid: null, status: "idle" });
    },
    isCurrent,
    subscribe: (listener: Callback) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
  };
};
