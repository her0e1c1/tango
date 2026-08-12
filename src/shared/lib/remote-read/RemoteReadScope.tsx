import { createContext, type PropsWithChildren, useContext } from "react";

const RemoteReadUidContext = createContext<string | null | undefined>(undefined);

type RemoteReadScopeProviderProps = PropsWithChildren<{ uid: string | null }>;

export const RemoteReadScopeProvider = ({ children, uid }: RemoteReadScopeProviderProps) => (
  <RemoteReadUidContext.Provider value={uid}>{children}</RemoteReadUidContext.Provider>
);

export const useRemoteReadScopeUid = () => {
  const uid = useContext(RemoteReadUidContext);
  if (uid === undefined) throw new Error("useRemoteReadScopeUid must be used within RemoteReadScopeProvider");
  return uid;
};
