import { authSessionStore } from "../store";

// Pre-authentication callers use a stable sentinel that remote command schemas reject as an unauthenticated uid.
// Do not add a `useAuthUid` hook: React code that must react to auth lifecycle changes should subscribe with
// `useAuthSession`, while code that only needs the current uid should read it directly through this query.
export function getAuthUid(): string {
  const session = authSessionStore.getState();
  return session.status === "authenticated" ? session.uid : "";
}
