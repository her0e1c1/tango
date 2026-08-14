import { useStore } from "zustand";

import { authSessionStore } from "./store";
import type { AuthSessionState } from "./types";

export const useAuthSession = (): AuthSessionState => useStore(authSessionStore);
