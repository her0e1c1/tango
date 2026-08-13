import { createContext, type PropsWithChildren, useContext } from "react";

export type RemoteReadLifecycle = {
  status: "loading" | "ready" | "blocked" | "error";
  error?: Error | undefined;
  retry: () => void | Promise<void>;
};

type RemoteReadScope = {
  uid: string | null;
  lifecycle?: RemoteReadLifecycle | undefined;
};

const RemoteReadScopeContext = createContext<RemoteReadScope | undefined>(undefined);

type RemoteReadScopeProviderProps = PropsWithChildren<RemoteReadScope>;

export const RemoteReadScopeProvider = ({ children, uid, lifecycle }: RemoteReadScopeProviderProps) => (
  <RemoteReadScopeContext.Provider value={{ uid, lifecycle }}>{children}</RemoteReadScopeContext.Provider>
);

export const useRemoteReadScope = () => {
  const scope = useContext(RemoteReadScopeContext);
  if (scope === undefined) throw new Error("useRemoteReadScope must be used within RemoteReadScopeProvider");
  return scope;
};
