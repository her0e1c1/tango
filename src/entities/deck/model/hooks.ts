import { useStore } from "zustand";

import { deckStore } from "./store";
import type { Deck, DeckId } from "./types";

export const useDeck = (id: DeckId | undefined): Deck | undefined =>
  useStore(deckStore, (state) => state.remoteDecks.find((deck) => deck.id === id));

export const useDecks = (): Deck[] => useStore(deckStore, (state) => state.remoteDecks);
