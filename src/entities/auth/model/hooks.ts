import { useStore } from "zustand";

import { authSessionStore } from "./store";
import type { AuthSessionState, GoogleAccount } from "./types";

// Reads the complete authentication lifecycle state.
export const useAuthSession = (): AuthSessionState => useStore(authSessionStore);

// This raw Firebase identity is for display and authentication diagnostics, never remote authorization.
export const useFirebaseUid = (): string =>
  useStore(authSessionStore, (auth) => (auth.status === "authenticated" ? auth.uid : ""));

// Reads the linked Google identity that grants remote persistence access.
export const useGoogleAccount = (): GoogleAccount | undefined => {
  const auth = useAuthSession();

  return auth.status === "authenticated" && auth.googleAccount != null
    ? { uid: auth.uid, displayName: auth.googleAccount.displayName }
    : undefined;
};

// Pre-authentication and non-Google sessions use a sentinel that remote command schemas reject.
export const useGoogleAccountUid = (): string => useGoogleAccount()?.uid ?? "";
