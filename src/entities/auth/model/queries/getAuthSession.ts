import { authSessionStore } from "../store";
import type { AuthSessionState } from "../types";

// Returns the current authentication lifecycle state outside React.
export const getAuthSession = (): AuthSessionState => authSessionStore.getState();
