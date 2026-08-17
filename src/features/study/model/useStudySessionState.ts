import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { removeStudySession, resolveStudySession, touchStudySession, useStudySession } from "@/entities/study-session";

import * as React from "react";

export type StudySessionState = ReturnType<typeof resolveStudySession<Card>>;

export const useStudySessionState = (deckId: DeckId, cards: readonly Card[]): StudySessionState => {
  const session = useStudySession(deckId);
  const sessionState = resolveStudySession(session, cards);

  React.useEffect(() => {
    if (sessionState.status === "studying") {
      touchStudySession(deckId);
      return;
    }
    if (sessionState.status === "preparing") return;

    // Invalid active progress must be removed before leaving so reopening the deck cannot repeat the same failure.
    removeStudySession(deckId);
  }, [deckId, sessionState.status]);

  return sessionState;
};
