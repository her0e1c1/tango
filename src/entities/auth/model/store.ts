import { createStore } from "zustand/vanilla";

import type { AuthSessionState } from "./types";

export const authSessionStore = createStore<AuthSessionState>()(() => ({ status: "initializing" }));

export const getAuthSession = (): AuthSessionState => authSessionStore.getState();

export function getAuthUid(): string {
  const session = getAuthSession();
  return session.status === "authenticated" ? session.uid : "";
}

export const replaceAuthSession = (session: AuthSessionState): void => {
  authSessionStore.setState(session, true);
};
