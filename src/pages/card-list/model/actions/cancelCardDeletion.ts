import { cardListStore } from "../store";

export function cancelCardDeletion(): void {
  if (cardListStore.getState().mutationId !== undefined) return;
  cardListStore.setState({ deletionTarget: undefined });
}
