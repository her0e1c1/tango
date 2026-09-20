import { cardListStore } from "../store";

export function cancelBulkDifficulty(): void {
  if (cardListStore.getState().mutationId !== undefined) return;
  cardListStore.setState({ bulk: undefined });
}
