import { createContext, useContext, useSyncExternalStore, type PropsWithChildren } from "react";

import type { SessionStore } from "@/entities/session/model/sessionStore";

const SessionContext = createContext<SessionStore | null>(null);

type SessionProviderProps = PropsWithChildren<{ store: SessionStore }>;

export const SessionProvider = ({ children, store }: SessionProviderProps) => (
  <SessionContext.Provider value={store}>{children}</SessionContext.Provider>
);

export const useSession = () => {
  const store = useContext(SessionContext);
  if (!store) throw new Error("useSession must be used within SessionProvider");
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
};
