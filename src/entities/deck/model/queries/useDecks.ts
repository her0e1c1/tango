import { useStore } from "zustand";

import { deckStore } from "../store";
import type { Deck } from "../types";

// Reads the remote and local Deck collections without remapping their values.
export const useDecks = (): Deck[] => {
  const state = useStore(deckStore);
  return [...state.remoteDecks, ...state.localDecks];
};
