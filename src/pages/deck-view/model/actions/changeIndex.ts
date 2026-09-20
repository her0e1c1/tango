import type { Card } from "@/entities/card";
import { deckViewStore } from "../store";

export function changeIndex(cards: readonly Card[], index: number): void {
  const card = cards[index];
  if (card === undefined) return;
  deckViewStore.setState((state) => ({
    cardId: card.id,
    showBackText: false,
    positionRevision: state.positionRevision + 1,
  }));
}
