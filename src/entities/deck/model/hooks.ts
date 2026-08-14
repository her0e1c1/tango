import { useStore } from "zustand";

import { deckStore } from "./store";
import type { Deck, DeckId } from "./types";

export const useDecks = (): Deck[] => useStore(deckStore, (state) => state.decks);

export const useDeck = (id: DeckId | undefined): Deck | undefined =>
  useStore(deckStore, (state) => state.decks.find((deck) => deck.id === id));
