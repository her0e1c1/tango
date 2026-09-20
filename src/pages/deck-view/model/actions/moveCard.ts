import type { Card } from "@/entities/card";
import { getDeckViewPosition } from "../queries/getDeckViewPosition";
import { deckViewStore } from "../store";

export function moveCard(cards: readonly Card[], direction: -1 | 1): "boundary" | undefined {
  if (cards.length === 0) return;
  const { index } = getDeckViewPosition(cards, deckViewStore.getState().cardId);
  const nextCard = cards[index + direction];
  if (nextCard === undefined) return "boundary";
  deckViewStore.setState((state) => ({
    cardId: nextCard.id,
    showBackText: false,
    positionRevision: state.positionRevision + 1,
  }));
  return undefined;
}
