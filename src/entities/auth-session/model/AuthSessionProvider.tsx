import { createContext, useContext, useSyncExternalStore, type PropsWithChildren } from "react";

import type { AuthSessionStore } from "@/entities/auth-session/model/authSessionStore";

const AuthSessionContext = createContext<AuthSessionStore | null>(null);

type AuthSessionProviderProps = PropsWithChildren<{ store: AuthSessionStore }>;

export const AuthSessionProvider = ({ children, store }: AuthSessionProviderProps) => (
  <AuthSessionContext.Provider value={store}>{children}</AuthSessionContext.Provider>
);

export const useAuthSession = () => {
  const store = useContext(AuthSessionContext);
  if (!store) throw new Error("useAuthSession must be used within AuthSessionProvider");
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
};
