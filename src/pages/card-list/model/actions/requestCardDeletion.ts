import { type CardId, getCards } from "@/entities/card";
import { cardListStore } from "../store";

export function requestCardDeletion(id: CardId): void {
  if (cardListStore.getState().mutationId !== undefined) return;
  const card = getCards().find((card) => card.id === id);
  if (card == null) return;
  // Keep the dialog target stable when an optimistic deletion removes the live Card.
  cardListStore.setState({ deletionTarget: { id, frontText: card.frontText } });
}
