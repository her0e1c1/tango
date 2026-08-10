import type { Card } from "./card";

export const createCard = (overrides: Partial<Card> = {}): Card => ({
  id: "card-id",
  deckId: "deck-id",
  uid: "user-id",
  frontText: "front",
  backText: "back",
  tags: [],
  uniqueKey: "unique-key",
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
  score: 0,
  numberOfSeen: 0,
  ...overrides,
});
