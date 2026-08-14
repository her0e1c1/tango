import type { Auth, User } from "firebase/auth";

import { getAuthSession, replaceAuthSession, type AuthSessionState } from "@/entities/auth-session";

type AuthRuntimeDependencies = {
  auth: Auth;
  onAuthStateChanged: (auth: Auth, onUser: (user: User | null) => void) => () => void;
  signInAnonymously: (auth: Auth) => Promise<unknown>;
};

type AuthenticatedAuthSession = Extract<AuthSessionState, { status: "authenticated" }>;

const authSessionFromUser = (user: User): AuthenticatedAuthSession => ({
  status: "authenticated",
  uid: user.uid,
  isAnonymous: user.isAnonymous,
  displayName: user.providerData[0]?.displayName ?? null,
});

export const createAuthRuntime = (dependencies: AuthRuntimeDependencies) => {
  let observerStarted = false;
  let anonymousBootstrapStarted = false;
  let anonymousBootstrapSuspended = false;

  const startAnonymousBootstrap = () => {
    if (anonymousBootstrapSuspended || anonymousBootstrapStarted || getAuthSession().status !== "signedOut") {
      return;
    }

    anonymousBootstrapStarted = true;
    void dependencies.signInAnonymously(dependencies.auth).catch((error) => {
      if (getAuthSession().status === "signedOut") {
        replaceAuthSession({ status: "error", error });
      }
    });
  };

  const publishObservedUser = (user: User | null) => {
    if (user) {
      anonymousBootstrapStarted = false;
      replaceAuthSession(authSessionFromUser(user));
      return;
    }

    replaceAuthSession({ status: "signedOut" });
    startAnonymousBootstrap();
  };

  const start = () => {
    if (observerStarted) return;
    observerStarted = true;
    dependencies.onAuthStateChanged(dependencies.auth, publishObservedUser);
  };

  const publishAuthenticatedUser = (user: User) => {
    const current = getAuthSession();
    if (current.status === "authenticated" && current.uid === user.uid) {
      replaceAuthSession(authSessionFromUser(user));
    }
  };

  const suspendAnonymousBootstrap = () => {
    anonymousBootstrapSuspended = true;
    return () => {
      anonymousBootstrapSuspended = false;
      startAnonymousBootstrap();
    };
  };

  return { start, publishAuthenticatedUser, suspendAnonymousBootstrap };
};

export type AuthRuntime = ReturnType<typeof createAuthRuntime>;
