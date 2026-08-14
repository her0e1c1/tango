import type { Deck } from "@/entities/deck";
import type { PropsWithChildren } from "react";
import { createContext, useContext } from "react";
import type { StoreApi } from "zustand/vanilla";

import { useRemoteRead } from "@/shared/lib/remote-read";
import type { RemoteReadStoreState } from "@/shared/lib/remote-read";

const DeckReadStoreContext = createContext<StoreApi<RemoteReadStoreState<Deck>> | undefined>(undefined);

type DeckReadProviderProps = PropsWithChildren<{ store: StoreApi<RemoteReadStoreState<Deck>> }>;

export const DeckReadProvider = ({ children, store }: DeckReadProviderProps) => (
  <DeckReadStoreContext.Provider value={store}>{children}</DeckReadStoreContext.Provider>
);

export const useDeckRead = () => {
  const store = useContext(DeckReadStoreContext);
  if (store === undefined) throw new Error("useDeckRead must be used within DeckReadProvider");
  const remote = useRemoteRead<Deck>(store);

  return {
    status: remote.status,
    syncStatus: remote.syncStatus,
    error: remote.error,
    retry: remote.retry,
  };
};
