import { useEffect, useEffectEvent } from "react";
import { useStore } from "zustand";
import type { Card } from "@/entities/card";
import type { NavigateFunction } from "react-router-dom";
import { deckViewStore } from "../store";
import { moveCard } from "./moveCard";

export function useDeckViewAutoPlay(
  cards: readonly Card[],
  currentCardId: string | undefined,
  interval: number,
  navigate: NavigateFunction
): void {
  const { autoPlay, helpOpen, positionRevision } = useStore(deckViewStore);
  // Read the current filtered collection without restarting playback for unrelated rerenders.
  const advance = useEffectEvent(() => moveCard(cards, 1, navigate));
  useEffect(() => {
    if (!autoPlay || helpOpen || interval <= 0 || currentCardId === undefined) return;
    const timer = window.setTimeout(() => advance(), interval * 1000);
    return () => window.clearTimeout(timer);
  }, [autoPlay, helpOpen, interval, currentCardId, positionRevision]);
}
