import { useMemo } from "react";
import { useStore } from "zustand";

import { filterCardsByDeckId, filterTagsByDeckId } from "./rules";
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

export const useCardsByDeckId = (deckId: string): { cards: Card[]; tags: string[] } => {
  const allCards = useCards();
  return useMemo(
    () => ({
      cards: filterCardsByDeckId(allCards, deckId),
      tags: filterTagsByDeckId(allCards, deckId),
    }),
    [allCards, deckId]
  );
};
