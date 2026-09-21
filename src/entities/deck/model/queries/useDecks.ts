import { useStore } from "zustand";

import { deckStore } from "../store";
import type { Deck } from "../types";

export const useDecks = (): Deck[] => {
  const state = useStore(deckStore);
  return state.remoteDecks;
};
