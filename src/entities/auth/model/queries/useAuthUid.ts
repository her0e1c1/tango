import { useStore } from "zustand";

import { authSessionStore } from "../store";

// Pre-authentication renders use a stable sentinel that remote command schemas reject as an unauthenticated uid.
export const useAuthUid = (): string =>
  useStore(authSessionStore, (auth) => (auth.status === "authenticated" ? auth.uid : ""));
