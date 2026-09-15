import type { Card } from "@/entities/card";
import { cardListStore } from "../store";

export function requestCardDeletion(card: Card): void {
  if (cardListStore.getState().mutationPending) return;
  cardListStore.setState({ deletionTarget: card });
}
