import { useStore } from "zustand";

import { deckStore } from "../store";
import type { Deck, DeckId } from "../types";

// Reads one Deck by identifier without remapping its value.
export const useDeck = (id: DeckId | undefined): Deck | undefined =>
  useStore(
    deckStore,
    (state) => state.remoteDecks.find((deck) => deck.id === id) ?? state.localDecks.find((deck) => deck.id === id)
  );
