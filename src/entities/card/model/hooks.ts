import { useStore } from "zustand";

import { cardStore } from "./store";
import type { Card, CardId } from "./types";

export const useCards = (): Card[] => {
  const state = useStore(cardStore);
  return [...state.remoteCards, ...state.localCards];
};

export const useCard = (id: CardId | undefined): Card | undefined =>
  useStore(
    cardStore,
    (state) => state.remoteCards.find((card) => card.id === id) ?? state.localCards.find((card) => card.id === id)
  );
