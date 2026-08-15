import { useStore } from "zustand";

import { authSessionStore } from "./store";
import type { AuthSessionState } from "./types";

export const useAuthSession = (): AuthSessionState => useStore(authSessionStore);

export const useAuthUid = (): string =>
  useStore(authSessionStore, (auth) => (auth.status === "authenticated" ? auth.uid : ""));
