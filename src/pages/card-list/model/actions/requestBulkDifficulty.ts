import type { Card } from "@/entities/card";
import type { CardListStore } from "../store";
import { dismissListError } from "./dismissListError";

export function requestBulkDifficulty(store: CardListStore, cards: readonly Card[]): void {
  if (store.getState().mutationPending) return;
  dismissListError(store);
  // Freeze the visible result set so filter updates cannot change the approved targets.
  store.setState({ bulkCardIds: cards.map(({ id }) => id), bulkDifficulty: null, bulkAttempted: false });
}
