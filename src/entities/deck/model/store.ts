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
import type { Deck, DeckId, DeckMigration, LocalDeckCreateInput } from "./types";

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

type LocalDeck = Extract<Deck, { localMode: true }>;

const hasSameDeckContent = (current: LocalDeck, candidate: LocalDeck): boolean =>
  current.id === candidate.id &&
  current.name === candidate.name &&
  current.url === candidate.url &&
  current.isPublic === candidate.isPublic &&
  current.scoreMax === candidate.scoreMax &&
  current.scoreMin === candidate.scoreMin &&
  current.selectedTags.length === candidate.selectedTags.length &&
  current.selectedTags.every((tag, index) => tag === candidate.selectedTags[index]) &&
  current.tagAndFilter === candidate.tagAndFilter &&
  current.category === candidate.category &&
  current.convertToBr === candidate.convertToBr &&
  current.createdAt === candidate.createdAt;

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
  return state.remoteDecks.find((deck) => deck.id === deckId) ?? state.localDecks.find((deck) => deck.id === deckId);
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
  const candidateDeck = localDeckSchema.parse(
    omitUndefined({
      ...currentDeck,
      ...edit,
      localMode: true,
      url: edit.url === null ? undefined : (edit.url ?? currentDeck.url),
    })
  );
  // A retry with identical form values must keep its persisted migration revision instead of creating a newer attempt.
  if (hasSameDeckContent(currentDeck, candidateDeck)) return currentDeck;

  const updatedValues = omitUndefined({
    ...candidateDeck,
    updatedAt: Date.now(),
    localRevision: currentDeck.localRevision + 1,
    migration: undefined,
  });
  const updatedDeck = localDeckSchema.parse(updatedValues);
  deckStore.setState({ localDecks: localDecks.map((deck) => (deck.id === updatedDeck.id ? updatedDeck : deck)) });
  return updatedDeck;
};

// Invalidates an in-flight migration before a local Card mutation can change its snapshot.
export const markLocalDeckChanged = (input: DeckId): Extract<Deck, { localMode: true }> => {
  const deckId = deckIdSchema.parse(input);
  const { localDecks } = deckStore.getState();
  const currentDeck = localDecks.find(({ id }) => id === deckId);
  if (currentDeck === undefined) throw new Error(`Local Deck "${deckId}" was not found`);

  const updatedDeck = localDeckSchema.parse(
    omitUndefined({ ...currentDeck, localRevision: currentDeck.localRevision + 1, migration: undefined })
  );
  deckStore.setState({ localDecks: localDecks.map((deck) => (deck.id === updatedDeck.id ? updatedDeck : deck)) });
  return updatedDeck;
};

// Persists the active remote attempt before network writes so a reload can resume or finish cleanup.
export const setLocalDeckMigration = (input: DeckId, migration: DeckMigration): Extract<Deck, { localMode: true }> => {
  const deckId = deckIdSchema.parse(input);
  const { localDecks } = deckStore.getState();
  const currentDeck = localDecks.find(({ id }) => id === deckId);
  if (currentDeck === undefined) throw new Error(`Local Deck "${deckId}" was not found`);
  if (migration.revision !== currentDeck.localRevision) {
    throw new Error("Local Deck changed before its migration attempt could be persisted");
  }

  const updatedDeck = localDeckSchema.parse({ ...currentDeck, migration });
  deckStore.setState({ localDecks: localDecks.map((deck) => (deck.id === updatedDeck.id ? updatedDeck : deck)) });
  return updatedDeck;
};

// Removes one local Deck after validating its identifier.
export const deleteLocalDeck = (input: DeckId): void => {
  const deckId = deckIdSchema.parse(input);
  deckStore.setState({ localDecks: deckStore.getState().localDecks.filter(({ id }) => id !== deckId) });
};
