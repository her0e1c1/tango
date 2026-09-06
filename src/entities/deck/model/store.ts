import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import type { z } from "zod";

import { persistedDeckStateSchema } from "./schema";
import type { Deck } from "./types";

/** Live Deck collections separated by remote and local persistence ownership. */
interface DeckState {
  remoteDecks: Extract<Deck, { localMode: false }>[];
  localDecks: Extract<Deck, { localMode: true }>[];
}

/** Injectable persistence controls used to create an isolated Deck store. */
interface CreateDeckStoreOptions {
  storage?: StateStorage;
  skipHydration?: boolean;
}

// Reject the stored collection as a unit so live state never mixes validated Decks with an incompatible payload.
const parsePersistedDeckState = (value: unknown): z.infer<typeof persistedDeckStateSchema> => {
  const result = persistedDeckStateSchema.safeParse(value);
  return result.success ? result.data : { localDecks: [] };
};

// Creates a Deck store whose durable state contains only validated local Decks.
const createDeckStore = ({ storage, skipHydration }: CreateDeckStoreOptions = {}) => {
  const persistStorage = createJSONStorage<z.infer<typeof persistedDeckStateSchema>>(() => storage ?? localStorage);
  return createStore<DeckState>()(
    persist<DeckState, [], [], z.infer<typeof persistedDeckStateSchema>>(() => ({ remoteDecks: [], localDecks: [] }), {
      name: "tango-local-decks",
      version: 1,
      ...(persistStorage !== undefined ? { storage: persistStorage } : {}),
      ...(skipHydration !== undefined ? { skipHydration } : {}),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...parsePersistedDeckState(persistedState),
      }),
      // Remote Decks belong to the active subscription and must not survive authentication changes in browser storage.
      partialize: ({ localDecks }) => ({ localDecks }),
    })
  );
};

export const deckStore = createDeckStore();
