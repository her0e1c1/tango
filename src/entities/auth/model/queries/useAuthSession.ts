import { useStore } from "zustand";

import { authSessionStore } from "../store";
import type { AuthSessionState } from "../types";

// Reads the complete authentication lifecycle state.
export const useAuthSession = (): AuthSessionState => useStore(authSessionStore);
