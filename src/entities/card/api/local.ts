import { generateId } from "@/shared/lib/generateId";
import { cardEditSchema, cardSchema } from "../model/schema";
import { cardStore, replaceLocalCards } from "../model/store";
import type { Card, CardCreateInput, CardEdit } from "../model/types";

export const generateCardId = generateId;

export const createLocalCard = async (input: CardCreateInput): Promise<void> => {
  const now = Date.now();
  const card = cardSchema.parse({ ...input, createdAt: now, updatedAt: now });
  replaceLocalCards([...cardStore.getState().localCards.filter((candidate) => candidate.id !== card.id), card]);
};

export const editLocalCard = async (input: CardEdit): Promise<void> => {
  const edit = cardEditSchema.parse(input);
  const current = cardStore.getState().localCards.find((card) => card.id === edit.id);
  if (current == null) throw new Error("Local Card not found");
  const card = cardSchema.parse({ ...current, ...edit, updatedAt: Date.now() });
  replaceLocalCards(cardStore.getState().localCards.map((candidate) => (candidate.id === card.id ? card : candidate)));
};

export const deleteLocalCard = async (card: Pick<Card, "id">): Promise<void> => {
  replaceLocalCards(cardStore.getState().localCards.filter((candidate) => candidate.id !== card.id));
};

export const deleteLocalCardsByDeckId = async (deckId: string): Promise<void> => {
  replaceLocalCards(cardStore.getState().localCards.filter((card) => card.deckId !== deckId));
};
