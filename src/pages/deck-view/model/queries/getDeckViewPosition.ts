import type { Card, CardId } from "@/entities/card";

export function getDeckViewPosition(cards: readonly Card[], cardId: CardId | undefined) {
  const index = Math.max(
    0,
    cards.findIndex((card) => card.id === cardId)
  );
  return { index, card: cards[index] };
}
