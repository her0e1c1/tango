import { getPreferences, toggleViewMode } from "@/entities/preference";
import type { Card } from "@/entities/card";
import { getDeckViewPosition } from "../queries/getDeckViewPosition";
import { deckViewStore } from "../store";

export function flipCard(cards: readonly Card[]): void {
  const state = deckViewStore.getState();
  const { card } = getDeckViewPosition(cards, state.cardId);
  if (card === undefined) return;
  if (!(card.id === state.cardId && state.showBackText) && getPreferences().controls.viewMode) {
    toggleViewMode();
    return;
  }
  deckViewStore.setState({
    cardId: card.id,
    showBackText: card.id !== state.cardId || !state.showBackText,
  });
}
