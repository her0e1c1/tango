import { useTimeoutFn, useUpdateEffect } from "react-use";
import { useStore } from "zustand";
import type { Card } from "@/entities/card";
import { useNavigate } from "react-router-dom";
import { usePreferences } from "@/entities/preference";
import { routes } from "@/shared/router";
import { getDeckViewPosition } from "../queries/getDeckViewPosition";
import { deckViewStore } from "../store";
import { moveCard } from "./moveCard";

export function useDeckViewAutoPlay(cards: readonly Card[]): void {
  const navigate = useNavigate();
  const {
    study: { cardInterval: interval },
  } = usePreferences();
  const { autoPlay, helpOpen, positionRevision, cardId } = useStore(deckViewStore);
  const currentCardId = getDeckViewPosition(cards, cardId).card?.id;
  const enabled = autoPlay && !helpOpen && interval > 0 && currentCardId !== undefined;
  // The timer reads the current filtered collection without restarting for unrelated rerenders.
  const [, cancel, restart] = useTimeoutFn(() => {
    if (!enabled) return;
    if (moveCard(cards, 1) === "boundary") void navigate(routes.deckList.to());
  }, interval * 1000);
  useUpdateEffect(() => {
    if (enabled) restart();
    else cancel();
  }, [enabled, interval, currentCardId, positionRevision, cancel, restart]);
}
