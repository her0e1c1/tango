import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { z } from "zod";

import { localDeckSchema } from "./schema";
import type { Deck } from "./types";

interface DeckState {
  remoteDecks: Deck[];
  localDecks: Deck[];
}

interface PersistedDeckState {
  localDecks: Deck[];
}

interface CreateDeckStoreOptions {
  storage?: StateStorage;
  skipHydration?: boolean;
}

const persistedDeckStateSchema = z.object({ localDecks: z.array(localDeckSchema) });

const parsePersistedDeckState = (value: unknown): PersistedDeckState => {
  const result = persistedDeckStateSchema.safeParse(value);
  return result.success ? result.data : { localDecks: [] };
};

const createDeckStore = ({ storage, skipHydration }: CreateDeckStoreOptions = {}) => {
  const persistStorage = createJSONStorage<PersistedDeckState>(() => storage ?? localStorage);
  return createStore<DeckState>()(
    persist<DeckState, [], [], PersistedDeckState>(() => ({ remoteDecks: [], localDecks: [] }), {
      name: "tango-local-decks",
      version: 1,
      ...(persistStorage !== undefined ? { storage: persistStorage } : {}),
      ...(skipHydration !== undefined ? { skipHydration } : {}),
      migrate: parsePersistedDeckState,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...parsePersistedDeckState(persistedState),
      }),
      partialize: ({ localDecks }) => ({ localDecks }),
    })
  );
};

export const deckStore = createDeckStore();

export const replaceRemoteDecks = (remoteDecks: Deck[]): void => {
  deckStore.setState({ remoteDecks });
};

export const clearRemoteDecks = (): void => {
  deckStore.setState({ remoteDecks: [] });
};

export const replaceLocalDecks = (localDecks: Deck[]): void => {
  deckStore.setState({ localDecks });
};
