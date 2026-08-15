import { useMemo } from "react";
import { useStore } from "zustand";

import { authSessionStore } from "./store";
import type { AuthAccount, AuthSessionState } from "./types";

export const useAuthSession = (): AuthSessionState => useStore(authSessionStore);

export const useAuthUid = (): string =>
  useStore(authSessionStore, (auth) => (auth.status === "authenticated" ? auth.uid : ""));

export const useAuthAccount = (): AuthAccount | undefined => {
  const auth = useAuthSession();

  return useMemo(
    () =>
      auth.status === "authenticated" && !auth.isAnonymous
        ? { uid: auth.uid, displayName: auth.displayName }
        : undefined,
    [auth]
  );
};
