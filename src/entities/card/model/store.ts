import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { persistedCardStateSchema } from "./schema";
import type { LocalCard, PersistedCardState, RemoteCard } from "./types";

/** Live Card collections separated by remote and local persistence ownership. */
interface CardState {
  remoteCards: RemoteCard[];
  localCards: LocalCard[];
}

/** Injectable persistence controls used to create an isolated Card store. */
interface CreateCardStoreOptions {
  storage?: StateStorage;
  skipHydration?: boolean;
}

// Reject the stored collection as a unit so live state never mixes validated Cards with an incompatible payload.
const parsePersistedCardState = (value: unknown): PersistedCardState => {
  const result = persistedCardStateSchema.safeParse(value);
  return result.success ? result.data : { localCards: [] };
};

// Creates a Card store whose durable state contains only validated local Cards.
const createCardStore = ({ storage, skipHydration }: CreateCardStoreOptions = {}) => {
  const persistStorage = createJSONStorage<PersistedCardState>(() => storage ?? localStorage);
  return createStore<CardState>()(
    persist<CardState, [], [], PersistedCardState>(() => ({ remoteCards: [], localCards: [] }), {
      name: "tango-local-cards",
      version: 1,
      ...(persistStorage !== undefined ? { storage: persistStorage } : {}),
      ...(skipHydration !== undefined ? { skipHydration } : {}),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...parsePersistedCardState(persistedState),
      }),
      // Remote Cards belong to the active subscription and must not survive authentication changes in browser storage.
      partialize: ({ localCards }) => ({ localCards }),
    })
  );
};

export const cardStore = createCardStore();
