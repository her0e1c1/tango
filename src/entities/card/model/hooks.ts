import { useStore } from "zustand";

import type { Card, CardId } from "./schema";
import { cardStore } from "./store";

export const useCards = (): Card[] => useStore(cardStore, (state) => state.cards);

export const useCard = (id: CardId | undefined): Card | undefined =>
  useStore(cardStore, (state) => state.cards.find((card) => card.id === id));
