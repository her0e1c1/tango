/**
 * @file Coordinates the Auth Context part of application authentication.
 * It turns Firebase authentication events into stable state that React components can safely
 * consume.
 */

import { onAuthStateChanged, signInAnonymously, type Auth, type User, type UserCredential } from "firebase/auth";
import { createContext, useContext, useSyncExternalStore, type PropsWithChildren } from "react";
import { auth } from "@/firebase";

export type AuthState =
  | { status: "initializing" }
  | { status: "authenticated"; user: User; uid: string }
  | { status: "signedOut" }
  | { status: "error"; error: unknown };

type AuthStoreDependencies = {
  auth: Auth;
  onAuthStateChanged: (
    auth: Auth,
    onUser: (user: User | null) => void,
    onError: (error: unknown) => void
  ) => () => void;
  signInAnonymously: (auth: Auth) => Promise<UserCredential>;
};

/**
 * Creates and configures an auth store.
 * Optional dependencies or settings let production code and tests reuse the same behavior in
 * different environments.
 */
export const createAuthStore = (dependencies: AuthStoreDependencies) => {
  let state: AuthState = { status: "initializing" };
  const listeners = new Set<() => void>();
  let observerStarted = false;
  let stopObserver: (() => void) | undefined;
  let anonymousAttempted = false;
  let anonymousInFlight: Promise<UserCredential> | undefined;
  let anonymousBootstrapSuspensions = 0;
  let disposed = false;

  /**
   * Replaces the controller's current state and notifies every subscriber.
   * Centralizing notification ensures React always observes the same snapshot that the controller
   * stores.
   */
  const setState = (nextState: AuthState) => {
    if (disposed) return;
    state = nextState;
    for (const listener of listeners) listener();
  };

  /**
   * Starts anonymous Firebase sign-in when the store is signed out and bootstrap is allowed.
   * Only one attempt runs for a signed-out state, and synchronous or asynchronous failures become
   * observable authentication errors.
   */
  const startAnonymousBootstrap = () => {
    if (disposed || anonymousBootstrapSuspensions > 0 || state.status !== "signedOut" || anonymousAttempted) {
      return;
    }
    anonymousAttempted = true;
    try {
      const attempt = dependencies.signInAnonymously(dependencies.auth);
      anonymousInFlight = attempt;
      void attempt.catch((error) => {
        if (anonymousInFlight === attempt) {
          anonymousInFlight = undefined;
          setState({ status: "error", error });
        }
      });
    } catch (error) {
      setState({ status: "error", error });
    }
  };

  /**
   * Attaches the single Firebase authentication observer used by this store.
   * User, sign-out, and observer-error callbacks are converted into snapshots consumed by React.
   */
  const startObserver = () => {
    if (observerStarted) return;
    observerStarted = true;
    try {
      stopObserver = dependencies.onAuthStateChanged(
        dependencies.auth,
        (user) => {
          if (disposed) return;
          if (user) {
            anonymousAttempted = false;
            anonymousInFlight = undefined;
            setState({ status: "authenticated", user, uid: user.uid });
            return;
          }
          setState({ status: "signedOut" });
          startAnonymousBootstrap();
        },
        (error) => setState({ status: "error", error })
      );
    } catch (error) {
      setState({ status: "error", error });
    }
  };

  return {
    /** Returns the current authentication snapshot without starting Firebase observation. */
    getSnapshot: () => state,
    /**
     * Registers a snapshot listener and starts the shared Firebase observer on first use.
     * The returned cleanup removes only this listener; dispose shuts down the entire store.
     */
    subscribe: (listener: () => void) => {
      if (disposed) throw new Error("Auth store has been disposed");
      listeners.add(listener);
      startObserver();
      return () => listeners.delete(listener);
    },
    /**
     * Replaces the stored Firebase user after an account upgrade without changing the active uid.
     * Updates for a different user are ignored so a stale login result cannot replace current state.
     */
    publishAuthenticatedUser: (user: User) => {
      if (state.status === "authenticated" && state.uid === user.uid) {
        setState({ status: "authenticated", user, uid: user.uid });
      }
    },
    /**
     * Pauses automatic anonymous sign-in during a sensitive authentication transition.
     * The idempotent cleanup releases one pause and restarts bootstrap after the final pause ends.
     */
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
    /**
     * Permanently stops observation and clears listeners owned by this store.
     * Repeated calls are safe and callbacks arriving afterward cannot publish new state.
     */
    dispose: () => {
      if (disposed) return;
      disposed = true;
      anonymousInFlight = undefined;
      listeners.clear();
      const unsubscribe = stopObserver;
      stopObserver = undefined;
      unsubscribe?.();
    },
  };
};

export type AuthStore = ReturnType<typeof createAuthStore>;

const authStore = createAuthStore({ auth, onAuthStateChanged, signInAnonymously });

/**
 * Publishes a newly authenticated Firebase user to the shared authentication store.
 * Login code uses this bridge so React subscribers observe the upgraded account immediately.
 */
export const publishAuthenticatedUser = (user: User) => authStore.publishAuthenticatedUser(user);

/**
 * Temporarily prevents the authentication store from starting a new anonymous session.
 * The returned cleanup function resumes bootstrap after logout or another sensitive transition
 * finishes.
 */
export const suspendAnonymousBootstrap = () => authStore.suspendAnonymousBootstrap();

const AuthContext = createContext<AuthStore | null>(null);

type AuthProviderProps = PropsWithChildren<{ store?: AuthStore }>;

/**
 * Makes the authentication store available to every descendant React component.
 * Tests may supply an isolated store, while production uses the shared Firebase-backed instance.
 */
export const AuthProvider = ({ children, store = authStore }: AuthProviderProps) => (
  <AuthContext.Provider value={store}>{children}</AuthContext.Provider>
);

/**
 * Provides the auth values and operations needed by React components.
 * Callers receive one focused interface without coordinating the authentication flow's stores and
 * services themselves.
 */
export const useAuth = () => {
  const store = useContext(AuthContext);
  if (!store) throw new Error("useAuth must be used within AuthProvider");
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
};
