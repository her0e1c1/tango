import { cardListStore } from "../store";

export function cancelCardDeletion(): void {
  if (cardListStore.getState().mutationPending) return;
  cardListStore.setState({ deletionTarget: undefined });
}
