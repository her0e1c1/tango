import type { DeckForCard } from "@/entities/deck/@x/card";
import type { Card as CardModel } from "./schema";

export type { Card, CardId } from "./schema";

export type CardDeck = DeckForCard;
export type CardRaw = Pick<CardModel, "frontText" | "backText" | "uniqueKey" | "tags">;

export const createCard = (card: CardRaw, deck: CardDeck, generateId: () => string): CardModel => {
  const { uid, id: deckId } = deck;
  return {
    ...card,
    uid,
    deckId,
    id: generateId(),
    score: 0,
    numberOfSeen: 0,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
  };
};
