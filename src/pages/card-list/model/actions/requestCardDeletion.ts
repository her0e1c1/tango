import type { CardId } from "@/entities/card";
import { cardListStore } from "../store";

export function requestCardDeletion(id: CardId): void {
  if (cardListStore.getState().mutationId !== undefined) return;
  cardListStore.setState({ deletionTarget: id });
}
