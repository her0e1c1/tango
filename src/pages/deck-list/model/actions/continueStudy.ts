import type { NavigateFunction } from "react-router-dom";
import type { DeckId } from "@/entities/deck";
import { touchStudySession } from "@/entities/study-session";
import { routes } from "@/shared/router";

export function continueStudy(deckId: DeckId, navigate: NavigateFunction): void {
  touchStudySession(deckId);
  void navigate(routes.deckStudy.to(deckId));
}
