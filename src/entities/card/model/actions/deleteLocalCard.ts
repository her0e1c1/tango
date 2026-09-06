import { cardIdSchema } from "../schema";
import type { CardId } from "../types";
import { cardStore } from "../store";

// Removes one local Card after validating its identifier.
export const deleteLocalCard = (input: CardId): void => {
  const cardId = cardIdSchema.parse(input);
  cardStore.setState({ localCards: cardStore.getState().localCards.filter(({ id }) => id !== cardId) });
};
