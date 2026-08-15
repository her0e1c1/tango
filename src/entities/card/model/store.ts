import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { z } from "zod";

import { persistedCardSchema } from "./schema";
import type { Card } from "./types";

interface CardState {
  remoteCards: Card[];
  localCards: Card[];
}

interface PersistedCardState {
  localCards: Card[];
}

interface CreateCardStoreOptions {
  storage?: StateStorage;
  skipHydration?: boolean;
}

const persistedCardStateSchema = z.object({ localCards: z.array(persistedCardSchema) });

const parsePersistedCardState = (value: unknown): PersistedCardState => {
  const result = persistedCardStateSchema.safeParse(value);
  return result.success ? result.data : { localCards: [] };
};

const createCardStore = ({ storage, skipHydration }: CreateCardStoreOptions = {}) => {
  const persistStorage = createJSONStorage<PersistedCardState>(() => storage ?? localStorage);
  return createStore<CardState>()(
    persist<CardState, [], [], PersistedCardState>(() => ({ remoteCards: [], localCards: [] }), {
      name: "tango-local-cards",
      version: 1,
      ...(persistStorage !== undefined ? { storage: persistStorage } : {}),
      ...(skipHydration !== undefined ? { skipHydration } : {}),
      migrate: parsePersistedCardState,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...parsePersistedCardState(persistedState),
      }),
      partialize: ({ localCards }) => ({ localCards }),
    })
  );
};

export const cardStore = createCardStore();

export const replaceRemoteCards = (remoteCards: Card[]): void => {
  cardStore.setState({ remoteCards });
};

export const clearRemoteCards = (): void => {
  cardStore.setState({ remoteCards: [] });
};

export const replaceLocalCards = (localCards: Card[]): void => {
  cardStore.setState({ localCards });
};
