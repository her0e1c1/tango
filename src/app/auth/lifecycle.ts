import { onIdTokenChanged, signInAnonymously, type User } from "firebase/auth";

import { setAuthUser, type AuthUser } from "@/entities/auth";
import { clearStudySessions } from "@/entities/study-session";
import { auth } from "@/shared/firebase";

export type AuthBootstrapStatus = "starting" | "authenticated" | "error";

const authUserFromFirebase = (user: User): AuthUser => ({
  uid: user.uid,
  isAnonymous: user.isAnonymous,
  displayName: user.providerData[0]?.displayName ?? null,
});

export const startAuthSession = (onStatusChange: (status: AuthBootstrapStatus) => void) => {
  let anonymousAttempt: symbol | null = null;
  let active = true;

  const startAnonymousBootstrap = () => {
    if (anonymousAttempt != null) return;

    setAuthUser(null);
    onStatusChange("starting");

    // A new anonymous identity must not inherit persisted study state from the identity that signed out.
    try {
      clearStudySessions();
    } catch {
      if (active) onStatusChange("error");
      return;
    }

    const attemptId = Symbol("anonymous-auth-attempt");
    anonymousAttempt = attemptId;
    void signInAnonymously(auth).catch(() => {
      // A late failure from an older attempt must not overwrite a newer authenticated or pending session.
      if (!active || anonymousAttempt !== attemptId) return;
      anonymousAttempt = null;
      onStatusChange("error");
    });
  };

  const stopObserving = onIdTokenChanged(auth, (user) => {
    if (!active) return;

    if (user) {
      anonymousAttempt = null;
      setAuthUser(authUserFromFirebase(user));
      onStatusChange("authenticated");
      return;
    }

    // Firebase may repeat the signed-out event while anonymous sign-in is pending; keep one bootstrap active.
    startAnonymousBootstrap();
  });

  return () => {
    active = false;
    stopObserving();
  };
};
