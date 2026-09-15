import type { Card } from "@/entities/card";
import { cardListStore } from "../store";

export function requestBulkDifficulty(cards: readonly Card[]): void {
  if (cardListStore.getState().mutationPending) return;
  // Freeze the visible result set so filter updates cannot change the approved targets.
  cardListStore.setState({ bulkCardIds: cards.map(({ id }) => id), bulkDifficulty: null, bulkAttempted: false });
}
