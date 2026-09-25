import { useStore } from "zustand";

import { authSessionStore } from "./store";
import type { AuthSessionState } from "./types";

export const useAuthSession = (): AuthSessionState => useStore(authSessionStore);

export const useAuth = () => {
  const authSession = useAuthSession();
  const session = authSession.status === "authenticated" ? authSession : undefined;

  return {
    isAnonymous: session?.isAnonymous ?? true,
    displayName: session?.displayName ?? null,
    uid: session?.uid ?? "",
  };
};
