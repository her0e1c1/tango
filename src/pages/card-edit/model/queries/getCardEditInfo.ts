import type { Card } from "@/entities/card";

export function getCardEditInfo(card: Card) {
  return {
    id: card.id,
    uniqueKey: card.uniqueKey,
    ...(card.createdAt ? { createdAt: card.createdAt } : {}),
  };
}
