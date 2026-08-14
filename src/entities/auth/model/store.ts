import { createStore } from "zustand/vanilla";

import { initialAuthSession } from "./defaults";
import type { AuthSessionState } from "./types";

export const authSessionStore = createStore<AuthSessionState>()(() => initialAuthSession);

export const getAuthSession = (): AuthSessionState => authSessionStore.getState();

export const subscribeAuthSession = (listener: (session: AuthSessionState) => void): (() => void) =>
  authSessionStore.subscribe(listener);

export const replaceAuthSession = (session: AuthSessionState): void => {
  authSessionStore.setState(session, true);
};
