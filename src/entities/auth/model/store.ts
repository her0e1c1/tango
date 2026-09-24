import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type { AuthSessionState } from "./types";

export const authSessionStore = createStore<AuthSessionState>()(() => ({ status: "initializing" }));

export const useAuthSession = (): AuthSessionState => useStore(authSessionStore);

export const getAuthSession = (): AuthSessionState => authSessionStore.getState();

export function getAuthUid(): string {
  const session = getAuthSession();
  return session.status === "authenticated" ? session.uid : "";
}

export const replaceAuthSession = (session: AuthSessionState): void => {
  authSessionStore.setState(session, true);
};

export const useAuth = () => {
  const authSession = useAuthSession();
  const session = authSession.status === "authenticated" ? authSession : undefined;

  return {
    isAnonymous: session?.isAnonymous ?? true,
    displayName: session?.displayName ?? null,
    uid: session?.uid ?? "",
  };
};
