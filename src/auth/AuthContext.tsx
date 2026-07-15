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

// biome-ignore lint/style/useComponentExportOnlyModules: The provider exposes its external store for tests.
export const createAuthStore = (dependencies: AuthStoreDependencies) => {
  let state: AuthState = { status: "initializing" };
  const listeners = new Set<() => void>();
  let observerStarted = false;
  let stopObserver: (() => void) | undefined;
  let anonymousAttempted = false;
  let anonymousInFlight: Promise<UserCredential> | undefined;
  let disposed = false;

  const setState = (nextState: AuthState) => {
    if (disposed) return;
    state = nextState;
    for (const listener of listeners) listener();
  };

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
          if (anonymousAttempted) return;
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
        },
        (error) => setState({ status: "error", error })
      );
    } catch (error) {
      setState({ status: "error", error });
    }
  };

  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      if (disposed) throw new Error("Auth store has been disposed");
      listeners.add(listener);
      startObserver();
      return () => listeners.delete(listener);
    },
    publishAuthenticatedUser: (user: User) => {
      if (state.status === "authenticated" && state.uid === user.uid) {
        setState({ status: "authenticated", user, uid: user.uid });
      }
    },
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

// biome-ignore lint/style/useComponentExportOnlyModules: Auth actions share the provider's singleton store.
export const publishAuthenticatedUser = (user: User) => authStore.publishAuthenticatedUser(user);

const AuthContext = createContext<AuthStore | null>(null);

type AuthProviderProps = PropsWithChildren<{ store?: AuthStore }>;

export const AuthProvider = ({ children, store = authStore }: AuthProviderProps) => (
  <AuthContext.Provider value={store}>{children}</AuthContext.Provider>
);

// biome-ignore lint/style/useComponentExportOnlyModules: The hook and provider form one public context API.
export const useAuth = () => {
  const store = useContext(AuthContext);
  if (!store) throw new Error("useAuth must be used within AuthProvider");
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
};
