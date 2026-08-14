import { useStore } from "zustand";

import type { Card, CardId } from "./schema";
import { cardStore } from "./store";

/** @public Scheduled for consumer migration in #773. */
export const useCards = (): Card[] => useStore(cardStore, (state) => state.cards);

/** @public Scheduled for consumer migration in #773. */
export const useCard = (id: CardId | undefined): Card | undefined =>
  useStore(cardStore, (state) => state.cards.find((card) => card.id === id));
