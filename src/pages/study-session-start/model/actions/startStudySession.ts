import type { NavigateFunction } from "react-router-dom";
import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { Preferences } from "@/entities/preference";
import { startStudy } from "@/entities/study-session";
import { routes } from "@/shared/router";

export function startStudySession(
  deckId: DeckId,
  cards: Card[],
  studyPreferences: Preferences["study"],
  navigate: NavigateFunction
): void {
  startStudy(deckId, cards, studyPreferences);
  void navigate(routes.deckStudy.to(deckId), { replace: true });
}
