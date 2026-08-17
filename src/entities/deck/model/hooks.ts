import { useStore } from "zustand";

import { toDeckDomainFromStore, toDeckView } from "./dto";
import { deckStore } from "./store";
import type { Deck, DeckId } from "./types";

// Reads remote and local Decks through their canonical domain representation.
export const useDecks = (): Deck[] => {
  const state = useStore(deckStore);
  return [...state.remoteDecks, ...state.localDecks].map((deck) =>
    toDeckView(toDeckDomainFromStore(deck), deck.localMode)
  );
};

// Reads one persistence-neutral Deck view by identifier through canonical domain state.
export const useDeck = (id: DeckId | undefined): Deck | undefined => {
  const storedDeck = useStore(
    deckStore,
    (state) => state.remoteDecks.find((deck) => deck.id === id) ?? state.localDecks.find((deck) => deck.id === id)
  );
  return storedDeck === undefined ? undefined : toDeckView(toDeckDomainFromStore(storedDeck), storedDeck.localMode);
};
