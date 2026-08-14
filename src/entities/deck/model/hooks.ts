import { useStore } from "zustand";

import type { Deck, DeckId } from "./schema";
import { deckStore } from "./store";

export const useDecks = (): Deck[] => useStore(deckStore, (state) => state.decks);

export const useDeck = (id: DeckId | undefined): Deck | undefined =>
  useStore(deckStore, (state) => state.decks.find((deck) => deck.id === id));
