import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import type { z } from "zod";

import { omitUndefined } from "@/shared/lib/omitUndefined";
import {
  deckEditSchema,
  deckIdSchema,
  localDeckCreateSchema,
  localDeckSchema,
  persistedDeckStateSchema,
} from "./schema";
import type { Deck, DeckId, LocalDeckCreateInput } from "./types";

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

// Replaces the remote Deck snapshot published by the active subscription.
export const replaceRemoteDecks = (remoteDecks: Extract<Deck, { localMode: false }>[]): void => {
  deckStore.setState({ remoteDecks });
};

// Clears all remote Decks when their authentication scope ends.
export const clearRemoteDecks = (): void => {
  deckStore.setState({ remoteDecks: [] });
};

// Finds one Deck across remote and local collections after validating its identifier.
export const findDeckById = (id: DeckId): Deck | undefined => {
  const deckId = deckIdSchema.parse(id);
  const state = deckStore.getState();
  // A failed migration can leave a remote duplicate; local remains authoritative until a retry succeeds.
  return state.localDecks.find((deck) => deck.id === deckId) ?? state.remoteDecks.find((deck) => deck.id === deckId);
};

// Creates and persists a local Deck with Entity-owned timestamps.
export const createLocalDeck = (input: LocalDeckCreateInput): Extract<Deck, { localMode: true }> => {
  const deck = localDeckCreateSchema.parse(input);
  const timestamp = Date.now();
  const createdDeck = localDeckSchema.parse({ ...deck, createdAt: timestamp, updatedAt: timestamp });
  // Treat a retried create as an upsert by id so persisted local data cannot accumulate duplicate Decks.
  const localDecks = deckStore.getState().localDecks.filter(({ id }) => id !== createdDeck.id);
  deckStore.setState({ localDecks: [...localDecks, createdDeck] });
  return createdDeck;
};

// Applies a validated partial edit to an existing local Deck.
export const editLocalDeck = (input: z.input<typeof deckEditSchema>): Extract<Deck, { localMode: true }> => {
  const edit = deckEditSchema.parse(input);
  const { localDecks } = deckStore.getState();
  const currentDeck = localDecks.find(({ id }) => id === edit.id);
  if (currentDeck === undefined) throw new Error(`Local Deck "${edit.id}" was not found`);

  // null is an edit command sentinel; stored Decks represent a missing URL by omitting the field.
  const updatedValues = omitUndefined({
    ...currentDeck,
    ...edit,
    url: edit.url === null ? undefined : (edit.url ?? currentDeck.url),
    updatedAt: Date.now(),
  });
  const updatedDeck = localDeckSchema.parse(updatedValues);
  deckStore.setState({ localDecks: localDecks.map((deck) => (deck.id === updatedDeck.id ? updatedDeck : deck)) });
  return updatedDeck;
};

// Removes one local Deck after validating its identifier.
export const deleteLocalDeck = (input: DeckId): void => {
  const deckId = deckIdSchema.parse(input);
  deckStore.setState({ localDecks: deckStore.getState().localDecks.filter(({ id }) => id !== deckId) });
};
