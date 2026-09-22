import { useKey, useLatest } from "react-use";
import type { Card } from "@/entities/card";
import { getPreferences, toggleShowSwipeButtonList } from "@/entities/preference";
import { shouldIgnoreCardShortcut } from "@/features/card-player";
import { useNavigate } from "react-router-dom";
import { routes } from "@/shared/router";
import { getDeckViewPosition } from "../queries/getDeckViewPosition";
import { deckViewStore } from "../store";
import { flipCard } from "./flipCard";
import { moveCard } from "./moveCard";
import { toggleAutoPlay } from "./toggleAutoPlay";

export function useDeckViewShortcuts(cards: readonly Card[]): void {
  const navigate = useNavigate();
  const latest = useLatest({ cards, navigate });
  useKey(
    (event) => ["ArrowLeft", "ArrowRight", "Enter", " ", "b"].includes(event.key),
    (event) => {
      const current = latest.current;
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.repeat ||
        deckViewStore.getState().helpOpen ||
        current.cards.length === 0 ||
        shouldIgnoreCardShortcut(event)
      )
        return;
      const state = deckViewStore.getState();
      const card = getDeckViewPosition(current.cards, state.cardId).card;
      const showBackText = card !== undefined && card.id === state.cardId && state.showBackText;
      if (!showBackText && getPreferences().controls.viewMode && (event.key.startsWith("Arrow") || event.key === " "))
        return;
      event.preventDefault();
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        if (moveCard(current.cards, event.key === "ArrowLeft" ? -1 : 1) === "boundary") {
          void current.navigate(routes.deckList.to());
        }
      } else if (event.key === "Enter") flipCard(current.cards);
      else if (event.key === "b") toggleShowSwipeButtonList();
      else if (getPreferences().study.cardInterval > 0) toggleAutoPlay();
    }
  );
}
