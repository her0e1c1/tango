import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";

import { getAuthSession, replaceAuthSession } from "@/entities/auth-session";
import { auth } from "@/shared/firebase";

let observerStarted = false;
let anonymousBootstrapStarted = false;
let anonymousBootstrapSuspended = false;

const authSessionFromUser = (user: User) => ({
  status: "authenticated" as const,
  uid: user.uid,
  isAnonymous: user.isAnonymous,
  displayName: user.providerData[0]?.displayName ?? null,
});

const startAnonymousBootstrap = () => {
  if (anonymousBootstrapSuspended || anonymousBootstrapStarted || getAuthSession().status !== "signedOut") {
    return;
  }

  anonymousBootstrapStarted = true;
  void signInAnonymously(auth).catch((error) => {
    if (getAuthSession().status === "signedOut") {
      replaceAuthSession({ status: "error", error });
    }
  });
};

export const startAuthSession = () => {
  if (observerStarted) return;
  observerStarted = true;
  onAuthStateChanged(auth, (user) => {
    if (user) {
      anonymousBootstrapStarted = false;
      replaceAuthSession(authSessionFromUser(user));
      return;
    }

    replaceAuthSession({ status: "signedOut" });
    startAnonymousBootstrap();
  });
};

export const publishAuthenticatedUser = (user: User) => {
  const current = getAuthSession();
  if (current.status === "authenticated" && current.uid === user.uid) {
    replaceAuthSession(authSessionFromUser(user));
  }
};

export const suspendAnonymousBootstrap = () => {
  anonymousBootstrapSuspended = true;
  return () => {
    anonymousBootstrapSuspended = false;
    startAnonymousBootstrap();
  };
};
