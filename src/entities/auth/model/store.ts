import { createStore } from "zustand/vanilla";

type AuthenticatedSession = {
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
};

export type AuthSessionState =
  | { status: "initializing" }
  | { status: "authenticating"; attemptId: string }
  | ({ status: "authenticated" } & AuthenticatedSession)
  | { status: "signedOut" }
  | { status: "error"; error: unknown };

const initialAuthSession: AuthSessionState = { status: "initializing" };

export const authSessionStore = createStore<AuthSessionState>()(() => initialAuthSession);

export const getAuthSession = (): AuthSessionState => authSessionStore.getState();

export const replaceAuthSession = (session: AuthSessionState): void => {
  authSessionStore.setState(session, true);
};
