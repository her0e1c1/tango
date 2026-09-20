import { useEffect, useEffectEvent } from "react";
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
  // Read the current filtered collection without restarting playback for unrelated rerenders.
  const advance = useEffectEvent(() => {
    if (moveCard(cards, 1) === "boundary") void navigate(routes.deckList.to());
  });
  useEffect(() => {
    if (!autoPlay || helpOpen || interval <= 0 || currentCardId === undefined) return;
    const timer = window.setTimeout(() => advance(), interval * 1000);
    return () => window.clearTimeout(timer);
  }, [autoPlay, helpOpen, interval, currentCardId, positionRevision]);
}
