type AuthenticatedSession = {
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
};

type AuthSessionState =
  | { status: "initializing" }
  | ({ status: "authenticated" } & AuthenticatedSession)
  | { status: "signedOut" }
  | { status: "error"; error: unknown };

export const createAuthSessionStore = (initialState: AuthSessionState = { status: "initializing" }) => {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    publish: (nextState: AuthSessionState) => {
      state = nextState;
      for (const listener of listeners) listener();
    },
  };
};

export type AuthSessionStore = ReturnType<typeof createAuthSessionStore>;
