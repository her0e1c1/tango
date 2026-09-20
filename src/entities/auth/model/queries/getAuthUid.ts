import { getAuthSession } from "./getAuthSession";

// Read the current identity when an action runs, not a snapshot captured during render.
// Do not define a UID-specific `use` hook: reactive consumers already have `useAuth` / `useAuthSession`.
// This getter does not subscribe; render values and effect dependencies must keep using those hooks.
// Both anonymous and linked users own documents in the same Firestore cache.
export function getAuthUid(): string {
  const session = getAuthSession();
  return session.status === "authenticated" ? session.uid : "";
}
