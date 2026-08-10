export type CardId = string;

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
