import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { z } from "zod";

import { deckEditSchema, deckIdSchema, localDeckCreateSchema, localDeckSchema } from "./schema";
import type { Deck, DeckEdit, DeckId, LocalDeckCreateInput } from "./types";

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

export const findDeckById = (id: DeckId): Deck | undefined => {
  const deckId = deckIdSchema.parse(id);
  const state = deckStore.getState();
  return state.remoteDecks.find((deck) => deck.id === deckId) ?? state.localDecks.find((deck) => deck.id === deckId);
};

/** @public */
export const createLocalDeck = (input: LocalDeckCreateInput): Deck => {
  const deck = localDeckCreateSchema.parse(input);
  const timestamp = Date.now();
  const createdDeck = localDeckSchema.parse({ ...deck, createdAt: timestamp, updatedAt: timestamp });
  const localDecks = deckStore.getState().localDecks.filter(({ id }) => id !== createdDeck.id);
  deckStore.setState({ localDecks: [...localDecks, createdDeck] });
  return createdDeck;
};

/** @public */
export const editLocalDeck = (input: DeckEdit): Deck => {
  const edit = deckEditSchema.parse(input);
  const localDecks = deckStore.getState().localDecks;
  const currentDeck = localDecks.find(({ id }) => id === edit.id);
  if (currentDeck === undefined) throw new Error(`Local Deck "${edit.id}" was not found`);

  const updatedDeck = localDeckSchema.parse({ ...currentDeck, ...edit, updatedAt: Date.now() });
  deckStore.setState({ localDecks: localDecks.map((deck) => (deck.id === updatedDeck.id ? updatedDeck : deck)) });
  return updatedDeck;
};

/** @public */
export const deleteLocalDeck = (input: DeckId): void => {
  const deckId = deckIdSchema.parse(input);
  deckStore.setState({ localDecks: deckStore.getState().localDecks.filter(({ id }) => id !== deckId) });
};
