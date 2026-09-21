import { useDecks } from "@/entities/deck/@x/card";
import { useStore } from "zustand";

import { cardStore } from "../store";
import type { Card } from "../types";

export const useCards = (): Card[] => {
  const state = useStore(cardStore);
  const decks = useDecks();
  return state.remoteCards.filter((card) => decks.some((deck) => deck.id === card.deckId && deck.uid === card.uid));
};
