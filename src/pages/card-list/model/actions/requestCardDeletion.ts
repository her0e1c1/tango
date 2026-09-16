import { type CardId, getCards, mustFindCardById } from "@/entities/card";
import { cardListStore } from "../store";

export function requestCardDeletion(id: CardId): void {
  if (cardListStore.getState().mutationId !== undefined) return;
  const card = mustFindCardById(getCards(), id);
  cardListStore.setState({ deletionTarget: card });
}
