import { useStore } from "zustand";

import { toDeckView } from "./dto";
import { deckStore } from "./store";
import type { Deck, DeckId } from "./types";

// Reads remote and local Decks as persistence-neutral views.
export const useDecks = (): Deck[] => {
  const state = useStore(deckStore);
  return [...state.remoteDecks, ...state.localDecks].map(toDeckView);
};

// Reads one persistence-neutral Deck view by identifier.
export const useDeck = (id: DeckId | undefined): Deck | undefined => {
  const storedDeck = useStore(
    deckStore,
    (state) => state.remoteDecks.find((deck) => deck.id === id) ?? state.localDecks.find((deck) => deck.id === id)
  );
  return storedDeck === undefined ? undefined : toDeckView(storedDeck);
};
