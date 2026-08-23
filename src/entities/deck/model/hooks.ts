import { useStore } from "zustand";

import { deckStore } from "./store";
import type { Deck, DeckId } from "./types";

// Reads the remote and local Deck collections without remapping their values.
export const useDecks = (): Deck[] => {
  const state = useStore(deckStore);
  return [...state.remoteDecks, ...state.localDecks];
};

// Distinguishes a missing remote Deck from a subscription that is loading or failed.
export const useRemoteDecksStatus = () => useStore(deckStore, (state) => state.remoteDecksStatus);

// Reads one Deck by identifier without remapping its value.
export const useDeck = (id: DeckId | undefined): Deck | undefined =>
  useStore(
    deckStore,
    (state) => state.remoteDecks.find((deck) => deck.id === id) ?? state.localDecks.find((deck) => deck.id === id)
  );
