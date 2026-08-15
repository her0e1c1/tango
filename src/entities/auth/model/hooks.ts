import { useMemo } from "react";
import { useStore } from "zustand";

import { authSessionStore } from "./store";
import type { AuthSessionState } from "./types";

export const useAuthSession = (): AuthSessionState => useStore(authSessionStore);

export const useAuthUid = (): string =>
  useStore(authSessionStore, (auth) => (auth.status === "authenticated" ? auth.uid : ""));

export const useAuthAccount = () => {
  const auth = useAuthSession();

  return useMemo(() => {
    const authenticatedUser = auth.status === "authenticated" ? auth : undefined;

    return {
      identity: {
        uid: authenticatedUser?.uid ?? "",
        displayName: authenticatedUser?.displayName ?? null,
      },
      isLinked: authenticatedUser != null && !authenticatedUser.isAnonymous,
    };
  }, [auth]);
};
