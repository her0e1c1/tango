import { cardIdSchema } from "../schema";
import { cardStore } from "../store";
import type { Card, CardId } from "../types";

// Finds one Card across remote and local collections after validating its identifier.
export const findCardById = (id: CardId): Card | undefined => {
  const cardId = cardIdSchema.parse(id);
  const state = cardStore.getState();
  return state.remoteCards.find((card) => card.id === cardId) ?? state.localCards.find((card) => card.id === cardId);
};
