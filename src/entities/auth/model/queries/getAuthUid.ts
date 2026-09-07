import { authSessionStore } from "../store";

// Pre-authentication callers use a stable sentinel that remote command schemas reject as an unauthenticated uid.
export function getAuthUid(): string {
  const session = authSessionStore.getState();
  return session.status === "authenticated" ? session.uid : "";
}
