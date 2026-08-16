import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { removeStudySession, resolveStudySession, touchStudySession, useStudySession } from "@/entities/study-session";

import * as React from "react";

export const useStudySessionState = (deckId: DeckId, cards: readonly Card[]) => {
  const session = useStudySession(deckId);
  const resolvedSession = resolveStudySession(session, cards);

  React.useEffect(() => {
    if (resolvedSession.status !== "studying") return;
    touchStudySession(deckId);
  }, [deckId, resolvedSession.status]);

  React.useEffect(() => {
    if (resolvedSession.status !== "invalid") return;

    // Invalid active progress must be removed before leaving so reopening the deck cannot repeat the same failure.
    removeStudySession(deckId);
  }, [deckId, resolvedSession.status]);

  return resolvedSession;
};

export type StudySessionState = ReturnType<typeof useStudySessionState>;
