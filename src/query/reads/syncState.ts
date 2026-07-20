/**
 * @file Coordinates remote read behavior for Sync State.
 * It turns Firestore subscriptions into observable application state while handling restarts,
 * stale callbacks, and errors.
 */

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

/**
 * Creates and configures a sync state.
 * Optional dependencies or settings let production code and tests reuse the same behavior in
 * different environments.
 */
export const createSyncState = <Collection extends string>(collections: readonly Collection[]) => {
  let activeUid: string | undefined;
  let generation = 0;
  let state: RemoteReadState = { uid: null, status: "idle" };
  let metadata = new Map<Collection, RemoteSnapshotMetadata>();
  const listeners = new Set<Callback>();

  /**
   * Replaces the controller's current state and notifies every subscriber.
   * Centralizing notification ensures React always observes the same snapshot that the controller
   * stores.
   */
  const setState = (next: RemoteReadState) => {
    state = next;
    listeners.forEach((listener) => {
      listener();
    });
  };

  /**
   * Checks whether a callback still belongs to the active user and subscription generation.
   * Older asynchronous callbacks return early instead of changing current application state.
   */
  const isCurrent = (uid: string, currentGeneration: number) => activeUid === uid && generation === currentGeneration;

  return {
    /**
     * Begins a loading generation for one user and clears metadata left by the previous session.
     * The returned generation token must accompany later observe and fail calls.
     */
    start: (uid: string) => {
      activeUid = uid;
      metadata = new Map();
      const currentGeneration = ++generation;
      setState({ uid, status: "loading" });
      return currentGeneration;
    },
    /**
     * Records one collection snapshot for the active generation.
     * State becomes ready only after every required collection has reported, with pending writes
     * taking precedence over cached and fully synchronized snapshots.
     */
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
    /** Publishes an error only when it belongs to the active user and generation. */
    fail: (uid: string, currentGeneration: number, error: Error) => {
      if (isCurrent(uid, currentGeneration)) setState({ uid, status: "error", error });
    },
    /**
     * Returns synchronization to idle and invalidates callbacks from the stopped generation.
     * A uid argument prevents an older session from stopping a newer user's subscriptions.
     */
    stop: (uid?: string) => {
      if (uid && uid !== activeUid) return;
      activeUid = undefined;
      metadata = new Map();
      generation += 1;
      setState({ uid: null, status: "idle" });
    },
    /** Exposes the stale-callback guard to the subscription controller. */
    isCurrent,
    /** Registers a state listener and returns a cleanup that removes that listener. */
    subscribe: (listener: Callback) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** Returns the current remote-read snapshot for external-store consumers. */
    getSnapshot: () => state,
  };
};
