import { deckStore } from "./store";
import type { Deck, DeckId } from "./types";

export function getDecks(): Deck[] {
  return deckStore.getState().remoteDecks;
}

// Returns the requested Deck or throws when a caller's Deck reference no longer resolves.
export const mustFindDeckById = (id: DeckId): Deck => {
  const deck = findDeckById(id);

  if (deck == null) throw new Error(`Deck not found: ${id}`);

  return deck;
};

export function findDeckById(id: DeckId): Deck | undefined {
  return getDecks().find((deck) => deck.id === id);
}
