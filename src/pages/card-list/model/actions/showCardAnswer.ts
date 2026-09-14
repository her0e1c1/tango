import type { Card } from "@/entities/card";
import type { CardListStore } from "../store";

export function showCardAnswer(store: CardListStore, card: Card | undefined): void {
  store.setState({ shownCard: card });
}
