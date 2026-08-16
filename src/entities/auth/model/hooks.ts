import { useStore } from "zustand";

import { authSessionStore } from "./store";
import type { AuthAccount, AuthSessionState } from "./types";

export const useAuthSession = (): AuthSessionState => useStore(authSessionStore);

// Pre-authentication renders use a stable sentinel that remote command schemas reject as an unauthenticated uid.
export const useAuthUid = (): string =>
  useStore(authSessionStore, (auth) => (auth.status === "authenticated" ? auth.uid : ""));

export const useAuthAccount = (): AuthAccount | undefined => {
  const auth = useAuthSession();

  return auth.status === "authenticated" && !auth.isAnonymous
    ? { uid: auth.uid, displayName: auth.displayName }
    : undefined;
};
