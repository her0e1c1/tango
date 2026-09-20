import type { NavigateFunction } from "react-router-dom";
import type { Card } from "@/entities/card";
import { routes } from "@/shared/router";
import { getDeckViewPosition } from "../queries/getDeckViewPosition";
import { deckViewStore } from "../store";

export function moveCard(cards: readonly Card[], direction: -1 | 1, navigate: NavigateFunction): void {
  if (cards.length === 0) return;
  const { index } = getDeckViewPosition(cards, deckViewStore.getState().cardId);
  const nextCard = cards[index + direction];
  if (nextCard === undefined) {
    void navigate(routes.deckList.to());
    return;
  }
  deckViewStore.setState((state) => ({
    cardId: nextCard.id,
    showBackText: false,
    positionRevision: state.positionRevision + 1,
  }));
}
