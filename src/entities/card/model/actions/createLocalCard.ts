import { localCardCreateSchema, localCardSchema } from "../schema";
import type { LocalCard, LocalCardCreateInput } from "../types";
import { cardStore } from "../store";

// Creates and persists a local Card with Entity-owned timestamps.
export const createLocalCard = (input: LocalCardCreateInput): LocalCard => {
  const card = localCardCreateSchema.parse(input);
  const timestamp = Date.now();
  const createdCard = localCardSchema.parse({ ...card, createdAt: timestamp, updatedAt: timestamp });
  // Treat a retried create as an upsert by id so persisted local data cannot accumulate duplicate Cards.
  const localCards = cardStore.getState().localCards.filter(({ id }) => id !== createdCard.id);
  cardStore.setState({ localCards: [...localCards, createdCard] });
  return createdCard;
};
