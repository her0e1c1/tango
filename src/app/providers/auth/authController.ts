import { onAuthStateChanged, signInAnonymously, type Auth, type User } from "firebase/auth";

import { createAuthSessionStore } from "@/entities/auth-session";
import { auth } from "@/shared/firebase";

type AuthRuntimeDependencies = {
  auth: Auth;
  onAuthStateChanged: (auth: Auth, onUser: (user: User | null) => void) => () => void;
  signInAnonymously: (auth: Auth) => Promise<unknown>;
};

const authSessionFromUser = (user: User) => ({
  uid: user.uid,
  isAnonymous: user.isAnonymous,
  displayName: user.providerData[0]?.displayName ?? null,
});

export const createAuthRuntime = (dependencies: AuthRuntimeDependencies) => {
  const authSessionStore = createAuthSessionStore();
  let observerStarted = false;
  let anonymousBootstrapStarted = false;
  let anonymousBootstrapSuspended = false;

  const startAnonymousBootstrap = () => {
    if (
      anonymousBootstrapSuspended ||
      anonymousBootstrapStarted ||
      authSessionStore.getSnapshot().status !== "signedOut"
    ) {
      return;
    }

    anonymousBootstrapStarted = true;
    void dependencies.signInAnonymously(dependencies.auth).catch((error) => {
      if (authSessionStore.getSnapshot().status === "signedOut") {
        authSessionStore.publish({ status: "error", error });
      }
    });
  };

  const publishObservedUser = (user: User | null) => {
    if (user) {
      anonymousBootstrapStarted = false;
      authSessionStore.publish({ status: "authenticated", ...authSessionFromUser(user) });
      return;
    }

    authSessionStore.publish({ status: "signedOut" });
    startAnonymousBootstrap();
  };

  const start = () => {
    if (observerStarted) return;
    observerStarted = true;
    dependencies.onAuthStateChanged(dependencies.auth, publishObservedUser);
  };

  const publishAuthenticatedUser = (user: User) => {
    const current = authSessionStore.getSnapshot();
    if (current.status === "authenticated" && current.uid === user.uid) {
      authSessionStore.publish({ status: "authenticated", ...authSessionFromUser(user) });
    }
  };

  const suspendAnonymousBootstrap = () => {
    anonymousBootstrapSuspended = true;
    return () => {
      anonymousBootstrapSuspended = false;
      startAnonymousBootstrap();
    };
  };

  return { authSessionStore, start, publishAuthenticatedUser, suspendAnonymousBootstrap };
};

export type AuthRuntime = ReturnType<typeof createAuthRuntime>;

export const authRuntime = createAuthRuntime({ auth, onAuthStateChanged, signInAnonymously });

export const { publishAuthenticatedUser, suspendAnonymousBootstrap } = authRuntime;
