import { createStore } from "zustand/vanilla";

import type { RemoteSyncStatus } from "@/shared/remote";

type CardReadLifecycleState = {
  uid: string | null;
  status: "idle" | "loading" | "ready" | "error";
  syncStatus?: RemoteSyncStatus | undefined;
  error?: Error | undefined;
  retry: () => void;
};

const noop = (): void => undefined;

const initialState = (): CardReadLifecycleState => ({
  uid: null,
  status: "idle",
  syncStatus: undefined,
  error: undefined,
  retry: noop,
});

export const cardReadLifecycleStore = createStore<CardReadLifecycleState>()(() => initialState());

export const setCardReadLoading = (uid: string, retry: () => void): void => {
  cardReadLifecycleStore.setState({
    uid,
    status: "loading",
    syncStatus: undefined,
    error: undefined,
    retry,
  });
};

export const setCardReadReady = (uid: string, syncStatus: RemoteSyncStatus): void => {
  if (cardReadLifecycleStore.getState().uid !== uid) return;
  cardReadLifecycleStore.setState({ status: "ready", syncStatus, error: undefined });
};

export const setCardReadError = (uid: string, error: Error): void => {
  if (cardReadLifecycleStore.getState().uid !== uid) return;
  cardReadLifecycleStore.setState({ status: "error", syncStatus: undefined, error });
};

export const resetCardRead = (uid?: string): void => {
  if (uid != null && cardReadLifecycleStore.getState().uid !== uid) return;
  cardReadLifecycleStore.setState(initialState());
};
