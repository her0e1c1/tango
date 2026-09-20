import type { Card } from "@/entities/card";
import { cardListStore } from "../store";

export function requestBulkDifficulty(cards: readonly Card[]): void {
  if (cardListStore.getState().mutationId !== undefined) return;
  // Freeze the visible result set so filter updates cannot change the approved targets.
  cardListStore.setState({
    bulk: { cardIds: cards.map(({ id }) => id), difficulty: null, attempted: false },
  });
}
