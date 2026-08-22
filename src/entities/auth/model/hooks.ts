import { useStore } from "zustand";

import { authUserStore } from "./store";
import type { AuthAccount } from "./types";

// Pre-authentication renders use a stable sentinel that remote command schemas reject as an unauthenticated uid.
export const useAuthUid = (): string => useStore(authUserStore, (user) => user?.uid ?? "");

export const useAuthAccount = (): AuthAccount | undefined => {
  const user = useStore(authUserStore, (currentUser) =>
    currentUser != null && !currentUser.isAnonymous ? currentUser : null
  );

  return user == null ? undefined : { uid: user.uid, displayName: user.displayName };
};
