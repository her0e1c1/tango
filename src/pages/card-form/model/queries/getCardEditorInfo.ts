import type { Card } from "@/entities/card";

export const getCardEditorInfo = (card: Card) => ({
  id: card.id,
  uniqueKey: card.uniqueKey,
  ...(card.createdAt ? { createdAt: card.createdAt } : {}),
  ...(card.lastSeenAt != null ? { lastSeenAt: card.lastSeenAt } : {}),
});
