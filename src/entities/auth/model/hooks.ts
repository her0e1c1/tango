import { useStore } from "zustand";

import { authSessionStore } from "./store";
import type { AuthAccount, AuthSessionState } from "./types";

// Reads the complete authentication lifecycle state.
export const useAuthSession = (): AuthSessionState => useStore(authSessionStore);

// Pre-authentication renders use a stable sentinel that remote command schemas reject as an unauthenticated uid.
export const useAuthUid = (): string =>
  useStore(authSessionStore, (auth) => (auth.status === "authenticated" ? auth.uid : ""));

// Reads the linked account identity while excluding anonymous sessions.
export const useAuthAccount = (): AuthAccount | undefined => {
  const auth = useAuthSession();

  return auth.status === "authenticated" && !auth.isAnonymous
    ? { uid: auth.uid, displayName: auth.displayName }
    : undefined;
};
