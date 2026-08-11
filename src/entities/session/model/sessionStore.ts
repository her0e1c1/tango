export type AuthenticatedSession = {
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
};

export type SessionState =
  | { status: "initializing" }
  | ({ status: "authenticated" } & AuthenticatedSession)
  | { status: "signedOut" }
  | { status: "error"; error: unknown };

export const createSessionStore = (initialState: SessionState = { status: "initializing" }) => {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    publish: (nextState: SessionState) => {
      state = nextState;
      for (const listener of listeners) listener();
    },
  };
};

export type SessionStore = ReturnType<typeof createSessionStore>;
