import { useKey, useLatest } from "react-use";
import { useNavigate } from "react-router-dom";
import type { Card } from "@/entities/card";
import { routes } from "@/shared/router";
import { handleDeckViewShortcut } from "./handleDeckViewShortcut";

export function useDeckViewShortcuts(cards: readonly Card[]): void {
  const navigate = useNavigate();
  const latest = useLatest({ cards, navigate });
  useKey(
    (event) => ["ArrowLeft", "ArrowRight", "Enter", " ", "b"].includes(event.key),
    (event) => {
      const current = latest.current;
      if (handleDeckViewShortcut(event, current.cards) === "boundary") void current.navigate(routes.deckList.to());
    }
  );
}
