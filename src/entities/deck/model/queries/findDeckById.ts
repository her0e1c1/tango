import { deckIdSchema } from "../schema";
import { deckStore } from "../store";
import type { Deck, DeckId } from "../types";

// Finds one Deck across remote and local collections after validating its identifier.
export const findDeckById = (id: DeckId): Deck | undefined => {
  const deckId = deckIdSchema.parse(id);
  const state = deckStore.getState();
  return state.remoteDecks.find((deck) => deck.id === deckId) ?? state.localDecks.find((deck) => deck.id === deckId);
};
