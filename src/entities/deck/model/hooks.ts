import { useStore } from "zustand";

import { deckStore } from "./store";
import type { Deck, DeckId } from "./types";

// Hides remote duplicates left by a partial migration while their retryable local Deck still exists.
export const useDecks = (): Deck[] => {
  const state = useStore(deckStore);
  const localIds = new Set(state.localDecks.map((deck) => deck.id));
  return [...state.remoteDecks.filter((deck) => !localIds.has(deck.id)), ...state.localDecks];
};

// Reads one Deck with the retryable local record taking precedence over a partial remote copy.
export const useDeck = (id: DeckId | undefined): Deck | undefined =>
  useStore(
    deckStore,
    (state) => state.localDecks.find((deck) => deck.id === id) ?? state.remoteDecks.find((deck) => deck.id === id)
  );
