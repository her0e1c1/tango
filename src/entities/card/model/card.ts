import type { Deck, DeckId } from "@/entities/deck";

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

export type CardDeck = Pick<Deck, "id" | "uid">;
export type CardRaw = Pick<Card, "frontText" | "backText" | "uniqueKey" | "tags">;
export type CardEdit = Partial<Card> & Pick<Card, "id" | "deckId">;
