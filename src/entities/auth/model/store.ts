import { createStore } from "zustand/vanilla";

import { initialAuthSession } from "./defaults";
import type { AuthSessionState } from "./types";

export const authSessionStore = createStore<AuthSessionState>()(() => initialAuthSession);

export const getAuthSession = (): AuthSessionState => authSessionStore.getState();

export const replaceAuthSession = (session: AuthSessionState): void => {
  // Replace the union variant wholesale so fields from an earlier authenticated session cannot survive a transition.
  authSessionStore.setState(session, true);
};
