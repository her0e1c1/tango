import { onAuthStateChanged, signInAnonymously, type Auth, type User, type UserCredential } from "firebase/auth";

import { createAuthSessionStore, type AuthSessionStore } from "@/entities/auth-session";
import { auth } from "@/shared/firebase";

type AuthControllerDependencies = {
  auth: Auth;
  authSessionStore: AuthSessionStore;
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

/** @internal */
export const createAuthController = (dependencies: AuthControllerDependencies) => {
  let observerStarted = false;
  let stopObserver: (() => void) | undefined;
  let anonymousAttempted = false;
  let anonymousInFlight: Promise<UserCredential> | undefined;
  let anonymousBootstrapSuspensions = 0;
  let disposed = false;

  const publishError = (error: unknown) => {
    if (!disposed) dependencies.authSessionStore.publish({ status: "error", error });
  };

  const startAnonymousBootstrap = () => {
    if (
      disposed ||
      anonymousBootstrapSuspensions > 0 ||
      dependencies.authSessionStore.getSnapshot().status !== "signedOut" ||
      anonymousAttempted
    ) {
      return;
    }

    anonymousAttempted = true;
    try {
      const attempt = dependencies.signInAnonymously(dependencies.auth);
      anonymousInFlight = attempt;
      void attempt.catch((error) => {
        if (anonymousInFlight === attempt) {
          anonymousInFlight = undefined;
          publishError(error);
        }
      });
    } catch (error) {
      publishError(error);
    }
  };

  const publishObservedUser = (user: User | null) => {
    if (disposed) return;
    if (user) {
      anonymousAttempted = false;
      anonymousInFlight = undefined;
      dependencies.authSessionStore.publish({ status: "authenticated", ...authSessionFromUser(user) });
      return;
    }

    dependencies.authSessionStore.publish({ status: "signedOut" });
    startAnonymousBootstrap();
  };

  return {
    start: () => {
      if (disposed) throw new Error("Auth controller has been disposed");
      if (observerStarted) return;
      observerStarted = true;
      try {
        stopObserver = dependencies.onAuthStateChanged(dependencies.auth, publishObservedUser, publishError);
      } catch (error) {
        publishError(error);
      }
    },
    publishAuthenticatedUser: (user: User) => {
      if (disposed) return;
      const current = dependencies.authSessionStore.getSnapshot();
      if (current.status === "authenticated" && current.uid === user.uid) {
        dependencies.authSessionStore.publish({ status: "authenticated", ...authSessionFromUser(user) });
      }
    },
    suspendAnonymousBootstrap: () => {
      if (disposed) return () => undefined;
      anonymousBootstrapSuspensions += 1;
      let released = false;
      return () => {
        if (released || disposed) return;
        released = true;
        anonymousBootstrapSuspensions -= 1;
        if (anonymousBootstrapSuspensions === 0) startAnonymousBootstrap();
      };
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      anonymousInFlight = undefined;
      const unsubscribe = stopObserver;
      stopObserver = undefined;
      unsubscribe?.();
    },
  };
};

type AuthRuntimeDependencies = Omit<AuthControllerDependencies, "authSessionStore">;

/** @internal */
export const createAuthRuntime = (dependencies: AuthRuntimeDependencies) => {
  const authSessionStore = createAuthSessionStore();
  return {
    authSessionStore,
    controller: createAuthController({ ...dependencies, authSessionStore }),
  };
};

export type AuthRuntime = ReturnType<typeof createAuthRuntime>;

export const authRuntime = createAuthRuntime({ auth, onAuthStateChanged, signInAnonymously });

export const publishAuthenticatedUser = (user: User) => authRuntime.controller.publishAuthenticatedUser(user);

export const suspendAnonymousBootstrap = () => authRuntime.controller.suspendAnonymousBootstrap();
