import { cardListStore, type CardListSortOrder } from "../store";

export function changeCardSortOrder(sortOrder: CardListSortOrder): void {
  const state = cardListStore.getState();
  if (state.mutationId !== undefined || state.deletionTarget != null) return;
  cardListStore.setState({ sortOrder });
}
