import type { NavigateFunction } from "react-router-dom";

import { touchStudySession } from "@/entities/study-session";
import { routes } from "@/shared/router";

export function continueStudy(deckId: string, navigate: NavigateFunction): void {
  touchStudySession(deckId);
  void navigate(routes.deckStudy.to(deckId));
}
