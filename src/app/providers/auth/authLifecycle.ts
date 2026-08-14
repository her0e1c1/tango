import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";

import { getAuthSession, replaceAuthSession } from "@/entities/auth-session";
import { clearStudyStore } from "@/features/study";
import { auth } from "@/shared/firebase";

let observerStarted = false;
let anonymousBootstrapStarted = false;
let previousUserCleanup: Promise<void> | null = null;

const authSessionFromUser = (user: User) => ({
  status: "authenticated" as const,
  uid: user.uid,
  isAnonymous: user.isAnonymous,
  displayName: user.providerData[0]?.displayName ?? null,
});

const startAnonymousBootstrap = () => {
  if (previousUserCleanup !== null || anonymousBootstrapStarted || getAuthSession().status !== "signedOut") {
    return;
  }

  anonymousBootstrapStarted = true;
  void signInAnonymously(auth).catch((error) => {
    if (getAuthSession().status === "signedOut") {
      replaceAuthSession({ status: "error", error });
    }
  });
};

const clearPreviousUser = () => {
  if (previousUserCleanup !== null) return;

  previousUserCleanup = clearStudyStore();
  void previousUserCleanup.then(
    () => {
      previousUserCleanup = null;
      startAnonymousBootstrap();
    },
    (error) => {
      if (getAuthSession().status === "signedOut") {
        replaceAuthSession({ status: "error", error });
      }
    }
  );
};

export const startAuthSession = () => {
  if (observerStarted) return;
  observerStarted = true;
  onAuthStateChanged(auth, (user) => {
    if (user) {
      anonymousBootstrapStarted = false;
      previousUserCleanup = null;
      replaceAuthSession(authSessionFromUser(user));
      return;
    }

    const hadAuthenticatedUser = getAuthSession().status === "authenticated";
    replaceAuthSession({ status: "signedOut" });
    if (hadAuthenticatedUser) {
      clearPreviousUser();
    } else {
      startAnonymousBootstrap();
    }
  });
};

export const publishAuthenticatedUser = (user: User) => {
  const current = getAuthSession();
  if (current.status === "authenticated" && current.uid === user.uid) {
    replaceAuthSession(authSessionFromUser(user));
  }
};
