import type { Card } from "@/entities/card";
import { getPreferences, toggleShowSwipeButtonList } from "@/entities/preference";
import { shouldIgnoreCardShortcut } from "@/features/card-player";
import { getDeckViewPosition } from "../queries/getDeckViewPosition";
import { deckViewStore } from "../store";
import { flipCard } from "./flipCard";
import { moveCard } from "./moveCard";
import { toggleAutoPlay } from "./toggleAutoPlay";

export function handleDeckViewShortcut(event: KeyboardEvent, cards: readonly Card[]): "boundary" | undefined {
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.repeat ||
    deckViewStore.getState().helpOpen ||
    cards.length === 0 ||
    shouldIgnoreCardShortcut(event)
  )
    return;
  const state = deckViewStore.getState();
  const card = getDeckViewPosition(cards, state.cardId).card;
  const showBackText = card !== undefined && card.id === state.cardId && state.showBackText;
  const reading = !showBackText && getPreferences().controls.viewMode;
  const movesCard = event.key.startsWith("Arrow") || event.key === " ";
  if (reading && movesCard) return;
  event.preventDefault();
  switch (event.key) {
    case "ArrowLeft":
    case "ArrowRight":
      if (moveCard(cards, event.key === "ArrowLeft" ? -1 : 1) === "boundary") {
        return "boundary";
      }
      return;
    case "Enter":
      flipCard(cards);
      return;
    case "b":
      toggleShowSwipeButtonList();
      return;
    case " ":
      if (getPreferences().study.cardInterval > 0) toggleAutoPlay();
  }
  return undefined;
}
