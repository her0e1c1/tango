import { localDeckCreateSchema, localDeckSchema } from "../schema";
import type { Deck, LocalDeckCreateInput } from "../types";
import { deckStore } from "../store";

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
