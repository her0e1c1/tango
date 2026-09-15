import { type Card, type CardId, mustFindCardById } from "@/entities/card";
import { cardListStore } from "../store";

export function requestCardDeletion(cards: readonly Card[], id: CardId): void {
  const card = mustFindCardById(cards, id);
  if (cardListStore.getState().mutationId !== undefined) return;
  cardListStore.setState({ deletionTarget: card });
}
