import { cardIdSchema } from "../schema";
import { getCards } from "./getCards";
import type { Card, CardId } from "../types";

export const findCardById = (id: CardId): Card | undefined => {
  const cardId = cardIdSchema.parse(id);
  return getCards().find((card) => card.id === cardId);
};
