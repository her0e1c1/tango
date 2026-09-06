import { cardDeckIdSchema } from "../schema";
import { cardStore } from "../store";

// Removes every local Card owned by a deleted Deck.
export const deleteLocalCardsByDeckId = (deckId: string): void => {
  const parsedDeckId = cardDeckIdSchema.parse(deckId);
  cardStore.setState({ localCards: cardStore.getState().localCards.filter((card) => card.deckId !== parsedDeckId) });
};
