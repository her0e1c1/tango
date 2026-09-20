import type { Card } from "@/entities/card";
import { cardListStore } from "../store";

export function showCardAnswer(card: Card | undefined): void {
  cardListStore.setState({
    shownCard: card === undefined ? undefined : { backText: card.backText, tags: card.tags },
  });
}
