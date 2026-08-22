import { onIdTokenChanged, signInAnonymously, type User } from "firebase/auth";

import type { CurrentUser } from "@/entities/user";
import { clearStudySessions } from "@/entities/study-session";
import { auth } from "@/shared/firebase";

export interface AuthSessionHandlers {
  onUserChange: (user: CurrentUser | null) => void;
  onError: (error: unknown) => void;
}

// Firebase Auth is a singleton, so the in-flight anonymous attempt must survive provider lifecycle recreation.
let anonymousAttempt: symbol | null = null;
let currentHandlers: AuthSessionHandlers | null = null;

const currentUserFromFirebase = (user: User): CurrentUser => ({
  uid: user.uid,
  isAnonymous: user.isAnonymous,
  displayName: user.providerData[0]?.displayName ?? null,
});

const startAnonymousBootstrap = () => {
  if (anonymousAttempt != null) return;

  // A new anonymous identity must not inherit persisted Study state from the identity that signed out.
  try {
    clearStudySessions();
  } catch (error) {
    currentHandlers?.onError(error);
    return;
  }

  const attemptId = Symbol("anonymous-auth-attempt");
  anonymousAttempt = attemptId;
  void signInAnonymously(auth).catch((error: unknown) => {
    // A late failure from an older attempt must not overwrite a newer authenticated or pending session.
    if (anonymousAttempt !== attemptId) return;
    anonymousAttempt = null;
    currentHandlers?.onError(error);
  });
};

export const startAuthSession = (handlers: AuthSessionHandlers) => {
  currentHandlers = handlers;
  const stopObserving = onIdTokenChanged(auth, (user) => {
    if (currentHandlers !== handlers) return;

    if (user) {
      anonymousAttempt = null;
      handlers.onUserChange(currentUserFromFirebase(user));
      return;
    }

    handlers.onUserChange(null);
    startAnonymousBootstrap();
  });

  return () => {
    if (currentHandlers === handlers) currentHandlers = null;
    stopObserving();
  };
};
