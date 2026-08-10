export type CardId = string;

export type CardRaw = Pick<Card, "frontText" | "backText" | "uniqueKey" | "tags">;
export type CardEdit = Partial<Card> & Pick<Card, "id"> & { deckId: string };
export type CardDeck = { id: string; uid: string };

export interface Card {
  frontText: string;
  backText: string;
  tags: string[];
  uniqueKey: string;
  id: CardId;
  deckId: string;
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
