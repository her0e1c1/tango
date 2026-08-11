import { onAuthStateChanged, signInAnonymously, type Auth, type User, type UserCredential } from "firebase/auth";

import { createSessionStore, type SessionStore } from "@/entities/session";
import { auth } from "@/shared/firebase";

type AuthControllerDependencies = {
  auth: Auth;
  sessionStore: SessionStore;
  onAuthStateChanged: (
    auth: Auth,
    onUser: (user: User | null) => void,
    onError: (error: unknown) => void
  ) => () => void;
  signInAnonymously: (auth: Auth) => Promise<UserCredential>;
};

const sessionFromUser = (user: User) => ({
  uid: user.uid,
  isAnonymous: user.isAnonymous,
  displayName: user.providerData[0]?.displayName ?? null,
});

export const createAuthController = (dependencies: AuthControllerDependencies) => {
  let observerStarted = false;
  let stopObserver: (() => void) | undefined;
  let anonymousAttempted = false;
  let anonymousInFlight: Promise<UserCredential> | undefined;
  let anonymousBootstrapSuspensions = 0;
  let disposed = false;

  const publishError = (error: unknown) => {
    if (!disposed) dependencies.sessionStore.publish({ status: "error", error });
  };

  const startAnonymousBootstrap = () => {
    if (
      disposed ||
      anonymousBootstrapSuspensions > 0 ||
      dependencies.sessionStore.getSnapshot().status !== "signedOut" ||
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
      dependencies.sessionStore.publish({ status: "authenticated", ...sessionFromUser(user) });
      return;
    }

    dependencies.sessionStore.publish({ status: "signedOut" });
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
      const current = dependencies.sessionStore.getSnapshot();
      if (current.status === "authenticated" && current.uid === user.uid) {
        dependencies.sessionStore.publish({ status: "authenticated", ...sessionFromUser(user) });
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

type AuthRuntimeDependencies = Omit<AuthControllerDependencies, "sessionStore">;

export const createAuthRuntime = (dependencies: AuthRuntimeDependencies) => {
  const sessionStore = createSessionStore();
  return {
    sessionStore,
    controller: createAuthController({ ...dependencies, sessionStore }),
  };
};

export type AuthRuntime = ReturnType<typeof createAuthRuntime>;

export const authRuntime = createAuthRuntime({ auth, onAuthStateChanged, signInAnonymously });

export const publishAuthenticatedUser = (user: User) => authRuntime.controller.publishAuthenticatedUser(user);

export const suspendAnonymousBootstrap = () => authRuntime.controller.suspendAnonymousBootstrap();
