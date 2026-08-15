import { z } from "zod";

import { cardCreateSchema, cardEditSchema, cardIdSchema, cardSchema } from "../model/schema";
import { cardStore, replaceLocalCards } from "../model/store";
import type { Card, CardCreateInput, CardEdit, CardId } from "../model/types";

/** @public */
export const createLocalCard = (input: CardCreateInput): Card => {
  const card = cardCreateSchema.parse(input);
  const timestamp = Date.now();
  const createdCard = cardSchema.parse({ ...card, createdAt: timestamp, updatedAt: timestamp });
  replaceLocalCards([...cardStore.getState().localCards.filter(({ id }) => id !== createdCard.id), createdCard]);
  return createdCard;
};

/** @public */
export const editLocalCard = (input: CardEdit): Card => {
  const edit = cardEditSchema.parse(input);
  const cards = cardStore.getState().localCards;
  const currentCard = cards.find(({ id }) => id === edit.id);
  if (currentCard === undefined) throw new Error(`Local Card "${edit.id}" was not found`);

  const updatedCard = cardSchema.parse({ ...currentCard, ...edit, updatedAt: Date.now() });
  replaceLocalCards(cards.map((card) => (card.id === updatedCard.id ? updatedCard : card)));
  return updatedCard;
};

/** @public */
export const deleteLocalCard = (input: CardId): void => {
  const cardId = cardIdSchema.parse(input);
  replaceLocalCards(cardStore.getState().localCards.filter(({ id }) => id !== cardId));
};

/** @public */
export const deleteLocalCardsByDeckId = (deckId: string): void => {
  const parsedDeckId = z.string().min(1, "Card deck is required").parse(deckId);
  replaceLocalCards(cardStore.getState().localCards.filter((card) => card.deckId !== parsedDeckId));
};
