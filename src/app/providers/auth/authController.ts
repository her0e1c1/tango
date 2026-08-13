import { onAuthStateChanged, signInAnonymously, type Auth, type User, type UserCredential } from "firebase/auth";

import { createAuthSessionStore } from "@/entities/auth-session";
import { auth } from "@/shared/firebase";

type AuthRuntimeDependencies = {
  auth: Auth;
  onAuthStateChanged: (
    auth: Auth,
    onUser: (user: User | null) => void,
    onError: (error: unknown) => void
  ) => () => void;
  signInAnonymously: (auth: Auth) => Promise<UserCredential>;
};

const authSessionFromUser = (user: User) => ({
  uid: user.uid,
  isAnonymous: user.isAnonymous,
  displayName: user.providerData[0]?.displayName ?? null,
});

export const createAuthRuntime = (dependencies: AuthRuntimeDependencies) => {
  const authSessionStore = createAuthSessionStore();
  let observerStarted = false;
  let anonymousSignIn: Promise<UserCredential> | undefined;
  let anonymousBootstrapSuspensions = 0;

  const publishError = (error: unknown) => authSessionStore.publish({ status: "error", error });

  const startAnonymousBootstrap = () => {
    if (anonymousBootstrapSuspensions > 0 || anonymousSignIn || authSessionStore.getSnapshot().status !== "signedOut") {
      return;
    }

    const attempt = dependencies.signInAnonymously(dependencies.auth);
    anonymousSignIn = attempt;
    void attempt.catch((error) => {
      if (anonymousSignIn === attempt) publishError(error);
    });
  };

  const publishObservedUser = (user: User | null) => {
    if (user) {
      anonymousSignIn = undefined;
      authSessionStore.publish({ status: "authenticated", ...authSessionFromUser(user) });
      return;
    }

    authSessionStore.publish({ status: "signedOut" });
    startAnonymousBootstrap();
  };

  const start = () => {
    if (observerStarted) return;
    observerStarted = true;
    dependencies.onAuthStateChanged(dependencies.auth, publishObservedUser, publishError);
  };

  const publishAuthenticatedUser = (user: User) => {
    const current = authSessionStore.getSnapshot();
    if (current.status === "authenticated" && current.uid === user.uid) {
      authSessionStore.publish({ status: "authenticated", ...authSessionFromUser(user) });
    }
  };

  const suspendAnonymousBootstrap = () => {
    anonymousBootstrapSuspensions += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      anonymousBootstrapSuspensions -= 1;
      if (anonymousBootstrapSuspensions === 0) startAnonymousBootstrap();
    };
  };

  return { authSessionStore, start, publishAuthenticatedUser, suspendAnonymousBootstrap };
};

export type AuthRuntime = ReturnType<typeof createAuthRuntime>;

export const authRuntime = createAuthRuntime({ auth, onAuthStateChanged, signInAnonymously });

export const { publishAuthenticatedUser, suspendAnonymousBootstrap } = authRuntime;
