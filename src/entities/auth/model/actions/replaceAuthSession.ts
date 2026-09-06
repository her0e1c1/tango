import { authSessionStore } from "../store";
import type { AuthSessionState } from "../types";

// Replaces the authentication lifecycle state with one complete variant.
export const replaceAuthSession = (session: AuthSessionState): void => {
  // Replace the union variant wholesale so fields from an earlier authenticated session cannot survive a transition.
  authSessionStore.setState(session, true);
};
