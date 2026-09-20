import { type Card, type CardId, mustFindCardById } from "@/entities/card";
import { cardListStore } from "../store";

export function showCardAnswer(cards: Card[], cardId: CardId): void {
  const card = mustFindCardById(cards, cardId);
  cardListStore.setState({ shownCard: { backText: card.backText, tags: card.tags } });
}
