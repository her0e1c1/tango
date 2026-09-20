import { cardIdSchema } from "../schema";
import { getCards } from "./getCards";
import type { Card, CardId } from "../types";

// Finds one Card across remote and local collections after validating its identifier.
export const findCardById = (id: CardId): Card | undefined => {
  const cardId = cardIdSchema.parse(id);
  return getCards().find((card) => card.id === cardId);
};
