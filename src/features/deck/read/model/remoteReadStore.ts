import { clearDecks, replaceDecks } from "@/entities/deck";
import type { RemoteSyncStatus } from "@/shared/api";
import { createStore } from "zustand/vanilla";
import { subscribeDeckReads } from "../api/subscribeDeckReads";

type Unsubscribe = () => void;

export interface DeckRemoteReadState {
  readonly uid: string | null;
  readonly status: "idle" | "loading" | "ready" | "error";
  readonly syncStatus?: RemoteSyncStatus | undefined;
  readonly error?: Error | undefined;
  start: (uid: string) => void;
  stop: (uid?: string) => void;
  retry: () => void;
}

const initialReadState = (): Omit<DeckRemoteReadState, "start" | "stop" | "retry"> => ({
  uid: null,
  status: "idle",
  syncStatus: undefined,
  error: undefined,
});

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)));

let currentSubscription: { unsubscribe?: Unsubscribe } | undefined;

export const deckRemoteReadStore = createStore<DeckRemoteReadState>()((set, get) => {
  const start = (uid: string) => {
    const previous = get();
    const previousSubscription = currentSubscription;
    currentSubscription = undefined;
    previousSubscription?.unsubscribe?.();
    if (previous.uid !== uid) clearDecks();

    set({ uid, status: "loading", syncStatus: undefined, error: undefined });

    const subscription: { unsubscribe?: Unsubscribe } = {};
    currentSubscription = subscription;
    try {
      subscription.unsubscribe = subscribeDeckReads({
        uid,
        onError: (error) => {
          if (currentSubscription !== subscription) return;
          currentSubscription = undefined;
          set({ status: "error", syncStatus: undefined, error });
          subscription.unsubscribe?.();
        },
        onSnapshot: (snapshot) => {
          if (currentSubscription !== subscription) return;
          replaceDecks(Object.values(snapshot.itemsById).filter((deck) => deck != null));
          set({ status: "ready", syncStatus: snapshot.syncStatus, error: undefined });
        },
      });
    } catch (cause) {
      if (currentSubscription !== subscription) return;
      currentSubscription = undefined;
      set({ status: "error", syncStatus: undefined, error: toError(cause) });
    }
    if (currentSubscription !== subscription) subscription.unsubscribe?.();
  };

  const stop = (uid?: string) => {
    if (uid != null && get().uid !== uid) return;
    const subscription = currentSubscription;
    currentSubscription = undefined;
    subscription?.unsubscribe?.();
    clearDecks();
    set(initialReadState());
  };

  const retry = () => {
    const uid = get().uid;
    if (uid != null) start(uid);
  };

  return { ...initialReadState(), start, stop, retry };
});

export const startDeckReads = (uid: string) => deckRemoteReadStore.getState().start(uid);
export const stopDeckReads = (uid?: string) => deckRemoteReadStore.getState().stop(uid);
