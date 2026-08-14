import { onIdTokenChanged, signInAnonymously, type User } from "firebase/auth";

import { getAuthSession, replaceAuthSession } from "@/entities/auth";
import { clearStudyStore } from "@/features/study";
import { auth } from "@/shared/firebase";

const authSessionFromUser = (user: User) => ({
  status: "authenticated" as const,
  uid: user.uid,
  isAnonymous: user.isAnonymous,
  displayName: user.providerData[0]?.displayName ?? null,
});

const startAnonymousBootstrap = () => {
  if (getAuthSession().status !== "signedOut") return;

  replaceAuthSession({ status: "authenticating" });
  void signInAnonymously(auth).catch((error) => {
    if (getAuthSession().status === "authenticating") replaceAuthSession({ status: "error", error });
  });
};

export const startAuthSession = () =>
  onIdTokenChanged(auth, (user) => {
    if (user) {
      replaceAuthSession(authSessionFromUser(user));
      return;
    }

    if (getAuthSession().status === "authenticating") return;

    replaceAuthSession({ status: "signedOut" });
    void clearStudyStore()
      .then(startAnonymousBootstrap)
      .catch((error) => {
        if (getAuthSession().status === "signedOut") replaceAuthSession({ status: "error", error });
      });
  });
