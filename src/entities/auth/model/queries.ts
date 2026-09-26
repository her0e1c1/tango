import { authSessionStore } from "./store";
import type { AuthSessionState } from "./types";

export const getAuthSession = (): AuthSessionState => authSessionStore.getState();

export function getAuthUid(): string {
  const session = getAuthSession();
  return session.status === "authenticated" ? session.uid : "";
}
