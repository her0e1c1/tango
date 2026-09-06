import type { AuthAccount } from "../types";
import { useAuthSession } from "./useAuthSession";

// Reads the linked account identity while excluding anonymous sessions.
export const useAuthAccount = (): AuthAccount | undefined => {
  const auth = useAuthSession();

  return auth.status === "authenticated" && !auth.isAnonymous
    ? { uid: auth.uid, displayName: auth.displayName }
    : undefined;
};
