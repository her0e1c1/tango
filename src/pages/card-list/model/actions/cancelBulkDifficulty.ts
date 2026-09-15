import { cardListStore } from "../store";

export function cancelBulkDifficulty(): void {
  if (cardListStore.getState().mutationPending) return;
  cardListStore.setState({ bulkCardIds: undefined });
}
