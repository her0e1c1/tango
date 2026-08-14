import { useStore } from "zustand";

import { authSessionStore, type AuthSessionState } from "./store";

export const useAuthSession = (): AuthSessionState => useStore(authSessionStore);
