import type { CardListStore } from "../store";

export function cancelCardDeletion(store: CardListStore): void {
  if (store.getState().mutationPending) return;
  store.setState({ deletionTarget: undefined });
}
