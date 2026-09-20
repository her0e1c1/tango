import { useKey, useLatest } from "react-use";
import type { Card } from "@/entities/card";
import { toggleShowSwipeButtonList } from "@/entities/preference";
import { shouldIgnoreCardShortcut } from "@/features/card-player";
import type { NavigateFunction } from "react-router-dom";
import { deckViewStore } from "../store";
import { flipCard } from "./flipCard";
import { moveCard } from "./moveCard";
import { toggleAutoPlay } from "./toggleAutoPlay";

export function useDeckViewShortcuts(
  cards: readonly Card[],
  playbackAvailable: boolean,
  navigate: NavigateFunction
): void {
  const latest = useLatest({ cards, playbackAvailable, navigate });
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
      event.preventDefault();
      if (event.key === "ArrowLeft") moveCard(current.cards, -1, current.navigate);
      else if (event.key === "ArrowRight") moveCard(current.cards, 1, current.navigate);
      else if (event.key === "Enter") flipCard(current.cards);
      else if (event.key === "b") toggleShowSwipeButtonList();
      else if (current.playbackAvailable) toggleAutoPlay();
    }
  );
}
