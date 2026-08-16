import { onIdTokenChanged, signInAnonymously, type User } from "firebase/auth";

import { getAuthSession, replaceAuthSession } from "@/entities/auth";
import { clearStudySessions } from "@/entities/study-session";
import { auth } from "@/shared/firebase";

const authSessionFromUser = (user: User) => ({
  status: "authenticated" as const,
  uid: user.uid,
  isAnonymous: user.isAnonymous,
  displayName: user.providerData[0]?.displayName ?? null,
});

const startAnonymousBootstrap = () => {
  if (getAuthSession().status !== "unauthenticated") return;

  // Bind failures to this attempt so a late rejection cannot overwrite a newer authenticated session.
  const attemptId = Symbol("anonymous-auth-attempt");
  replaceAuthSession({ status: "authenticating", attemptId });
  void signInAnonymously(auth).catch((error: unknown) => {
    const currentSession = getAuthSession();
    if (currentSession.status === "authenticating" && currentSession.attemptId === attemptId) {
      replaceAuthSession({ status: "error", error });
    }
  });
};

export const startAuthSession = () =>
  onIdTokenChanged(auth, (user) => {
    if (user) {
      replaceAuthSession(authSessionFromUser(user));
      return;
    }

    // Firebase may repeat the signed-out event while anonymous sign-in is pending; keep one bootstrap active.
    if (getAuthSession().status === "authenticating") return;

    replaceAuthSession({ status: "unauthenticated" });
    // A new anonymous identity must not inherit persisted study state from the identity that signed out.
    try {
      clearStudySessions();
      startAnonymousBootstrap();
    } catch (error) {
      if (getAuthSession().status === "unauthenticated") replaceAuthSession({ status: "error", error });
    }
  });
