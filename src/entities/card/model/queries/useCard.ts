import { useStore } from "zustand";

import { cardStore } from "../store";
import type { Card, CardId } from "../types";

// Reads one Card by identifier across both persistence modes.
export const useCard = (id: CardId | undefined): Card | undefined =>
  useStore(
    cardStore,
    (state) => state.remoteCards.find((card) => card.id === id) ?? state.localCards.find((card) => card.id === id)
  );
