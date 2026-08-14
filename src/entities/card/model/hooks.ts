import { useStore } from "zustand";

import { cardStore } from "./store";
import type { Card, CardId } from "./types";

export const useCards = (): Card[] => useStore(cardStore, (state) => state.cards);

export const useCard = (id: CardId | undefined): Card | undefined =>
  useStore(cardStore, (state) => state.cards.find((card) => card.id === id));
