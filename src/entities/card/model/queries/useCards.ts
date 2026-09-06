import { useStore } from "zustand";

import { cardStore } from "../store";
import type { Card } from "../types";

// Reads remote and local Cards as one ordered collection.
export const useCards = (): Card[] => {
  const state = useStore(cardStore);
  return [...state.remoteCards, ...state.localCards];
};
