import { onIdTokenChanged, signInAnonymously, type User, type UserCredential } from "firebase/auth";

import { getAuthSession, replaceAuthSession } from "@/entities/auth";
import { clearStudyStore } from "@/features/study";
import { auth } from "@/shared/firebase";

let anonymousSignIn: Promise<UserCredential> | undefined;

const authSessionFromUser = (user: User) => ({
  status: "authenticated" as const,
  uid: user.uid,
  isAnonymous: user.isAnonymous,
  displayName: user.providerData[0]?.displayName ?? null,
});

const startAnonymousBootstrap = () => {
  if (anonymousSignIn || getAuthSession().status !== "signedOut") return;

  const pendingSignIn = signInAnonymously(auth);
  anonymousSignIn = pendingSignIn;
  void pendingSignIn.catch((error) => {
    if (anonymousSignIn !== pendingSignIn) return;

    anonymousSignIn = undefined;
    if (getAuthSession().status === "signedOut") replaceAuthSession({ status: "error", error });
  });
};

export const startAuthSession = () =>
  onIdTokenChanged(auth, (user) => {
    if (user) {
      anonymousSignIn = undefined;
      replaceAuthSession(authSessionFromUser(user));
      return;
    }

    replaceAuthSession({ status: "signedOut" });
    void clearStudyStore()
      .then(startAnonymousBootstrap)
      .catch((error) => {
        if (getAuthSession().status === "signedOut") replaceAuthSession({ status: "error", error });
      });
  });
