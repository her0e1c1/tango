import { getAuthSession } from "./getAuthSession";

// Read the current identity when an action runs, not a snapshot captured during render.
// Do not define a UID-specific `use` hook: reactive consumers already have `useAuth` / `useAuthSession`.
// This getter does not subscribe; render values and effect dependencies must keep using those hooks.
// Guests, including Firebase anonymous users, have no cloud persistence identity.
// The empty sentinel is rejected by remote command schemas while local operations remain available.
export function getAuthUid(): string {
  const session = getAuthSession();
  return session.status === "authenticated" && !session.isAnonymous ? session.uid : "";
}
