import { type CardId, mustFindCardById } from "@/entities/card";
import { cardListStore } from "../store";

export function showCardAnswer(cardId: CardId): void {
  const card = mustFindCardById(cardId);
  cardListStore.setState({ shownCard: { backText: card.backText, tags: card.tags } });
}
