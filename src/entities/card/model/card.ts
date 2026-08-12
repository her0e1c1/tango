import type { DeckForCard, DeckId } from "@/entities/deck/@x/card";

export type CardId = string;

export interface Card {
  frontText: string;
  backText: string;
  tags: string[];
  uniqueKey: string;
  id: CardId;
  deckId: DeckId;
  uid: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  score: number;
  numberOfSeen: number;
  lastSeenAt?: number;
  nextSeeingAt?: Date;
  interval?: number;
  url?: string;
  startLine?: number;
  endLine?: number;
}

export type CardDeck = DeckForCard;
export type CardRaw = Pick<Card, "frontText" | "backText" | "uniqueKey" | "tags">;
export type CardEdit = Partial<Card> & Pick<Card, "id" | "deckId">;

export const createCard = (card: CardRaw, deck: CardDeck, generateId: () => string): Card => {
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
