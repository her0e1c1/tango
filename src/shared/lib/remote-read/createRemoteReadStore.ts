import type { StoreApi } from "zustand";
import { createStore } from "zustand/vanilla";

import {
  toRemoteById,
  type RemoteById,
  type RemoteSnapshot,
  type RemoteSnapshotMetadata,
  type RemoteSubscriptionProps,
  type RemoteSyncStatus,
} from "@/shared/api";
import type { FirestoreInitializationResult } from "@/shared/firebase/firestore-runtime";
import { applyRealtimeChange } from "@/shared/lib/realtimeChange";

type Unsubscribe = () => void;

export interface RemoteReadDependencies<T> {
  waitForInitialization: () => Promise<FirestoreInitializationResult>;
  subscribe: (props: RemoteSubscriptionProps<T>) => Unsubscribe;
}

export interface RemoteReadStoreState<T extends { id: string }> {
  readonly uid: string | null;
  readonly status: "idle" | "loading" | "ready" | "blocked" | "error";
  readonly itemsById: RemoteById<T>;
  readonly syncStatus?: RemoteSyncStatus | undefined;
  readonly error?: Error | undefined;
  start: (uid: string) => Promise<void>;
  stop: (uid?: string) => void;
  retry: () => Promise<void>;
}

interface ReadSession {
  readonly uid: string;
  subscription: Unsubscribe | undefined;
}

const initialReadState = <T extends { id: string }>(): Omit<RemoteReadStoreState<T>, "start" | "stop" | "retry"> => ({
  uid: null,
  status: "idle",
  itemsById: {},
  syncStatus: undefined,
  error: undefined,
});

const applySnapshot = <T extends { id: string }>(
  previous: RemoteById<T>,
  snapshot: RemoteSnapshot<T>
): RemoteById<T> =>
  snapshot.type === "replace" ? toRemoteById(snapshot.items) : applyRealtimeChange(previous, snapshot.event);

const deriveSyncStatus = (metadata: RemoteSnapshotMetadata): RemoteSyncStatus => {
  if (metadata.hasPendingWrites) return "pending";
  if (metadata.fromCache) return "cached";
  return "synced";
};

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)));

const close = (unsubscribe: Unsubscribe | undefined) => {
  try {
    unsubscribe?.();
  } catch {
    // Listener cleanup is best-effort because stale callbacks are guarded by session identity.
  }
};

export const createRemoteReadStore = <T extends { id: string }>(
  dependencies: RemoteReadDependencies<T>
): StoreApi<RemoteReadStoreState<T>> => {
  let activeSession: ReadSession | undefined;

  const isCurrent = (session: ReadSession) => activeSession === session;

  const cleanupSession = (session: ReadSession | undefined) => {
    if (session == null) return;
    const subscription = session.subscription;
    session.subscription = undefined;
    close(subscription);
  };

  return createStore<RemoteReadStoreState<T>>()((set, get) => {
    const fail = (session: ReadSession, status: "blocked" | "error", cause: unknown) => {
      if (!isCurrent(session)) return;
      activeSession = undefined;
      cleanupSession(session);
      set({ status, syncStatus: undefined, error: toError(cause) });
    };

    const initializeSession = async (session: ReadSession): Promise<FirestoreInitializationResult> => {
      let initialization: FirestoreInitializationResult;
      try {
        initialization = await dependencies.waitForInitialization();
      } catch (cause) {
        fail(session, "error", cause);
        throw toError(cause);
      }
      return initialization;
    };

    const subscribeToSession = (session: ReadSession) => {
      const onError = (error: Error) => fail(session, "error", error);
      try {
        const subscription = dependencies.subscribe({
          uid: session.uid,
          onError,
          onSnapshot: (snapshot) => {
            if (!isCurrent(session)) return;
            set({
              itemsById: applySnapshot(get().itemsById, snapshot),
              status: "ready",
              syncStatus: deriveSyncStatus(snapshot.metadata),
              error: undefined,
            });
          },
        });
        if (!isCurrent(session)) {
          close(subscription);
          return;
        }
        session.subscription = subscription;
      } catch (cause) {
        if (isCurrent(session)) {
          fail(session, "error", cause);
        } else {
          cleanupSession(session);
        }
        throw toError(cause);
      }
    };

    const start = async (uid: string): Promise<void> => {
      const previous = get();
      const previousSession = activeSession;
      const session: ReadSession = { uid, subscription: undefined };
      activeSession = session;
      cleanupSession(previousSession);
      if (!isCurrent(session)) return;

      const retainCurrentData = previous.uid === session.uid;
      set({
        uid: session.uid,
        status: "loading",
        itemsById: retainCurrentData ? previous.itemsById : {},
        syncStatus: undefined,
        error: undefined,
      });

      const initialization = await initializeSession(session);
      if (!isCurrent(session)) return;
      if (initialization.status === "blocked") {
        fail(session, "blocked", initialization.error);
        return;
      }

      subscribeToSession(session);
    };

    const stop = (uid?: string) => {
      if (uid != null && get().uid !== uid) return;
      const session = activeSession;
      activeSession = undefined;
      cleanupSession(session);
      set(initialReadState<T>());
    };

    const retry = () => {
      const uid = get().uid;
      return uid == null ? Promise.resolve() : start(uid);
    };

    return {
      ...initialReadState<T>(),
      start,
      stop,
      retry,
    };
  });
};
