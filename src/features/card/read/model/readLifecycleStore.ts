import { createStore } from "zustand/vanilla";

type CardReadLifecycleState = {
  uid: string | null;
  status: "idle" | "loading" | "ready" | "error";
  serverConfirmed: boolean;
  error?: Error | undefined;
};

const initialState = (): CardReadLifecycleState => ({
  uid: null,
  status: "idle",
  serverConfirmed: false,
  error: undefined,
});

export const cardReadLifecycleStore = createStore<CardReadLifecycleState>()(() => initialState());

export const setCardReadLoading = (uid: string): void => {
  cardReadLifecycleStore.setState({
    uid,
    status: "loading",
    serverConfirmed: false,
    error: undefined,
  });
};

export const setCardReadReady = (uid: string, serverConfirmed: boolean): void => {
  if (cardReadLifecycleStore.getState().uid !== uid) return;
  cardReadLifecycleStore.setState({ status: "ready", serverConfirmed, error: undefined });
};

export const setCardReadError = (uid: string, error: Error): void => {
  if (cardReadLifecycleStore.getState().uid !== uid) return;
  cardReadLifecycleStore.setState({ status: "error", serverConfirmed: false, error });
};

export const resetCardRead = (uid?: string): void => {
  if (uid != null && cardReadLifecycleStore.getState().uid !== uid) return;
  cardReadLifecycleStore.setState(initialState());
};
