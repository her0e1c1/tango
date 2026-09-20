import type { NavigateFunction } from "react-router-dom";

import type { Card } from "@/entities/card";
import type { Preferences } from "@/entities/preference";
import { startStudy } from "@/entities/study-session";
import { routes } from "@/shared/router";

export function startStudySession(
  deckId: string,
  cards: Card[],
  preferences: Preferences["study"],
  navigate: NavigateFunction
): void {
  startStudy(deckId, cards, preferences);
  void navigate(routes.deckStudy.to(deckId), { replace: true });
}
