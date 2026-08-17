import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { useStudyProgresses } from "@/entities/study-progress";
import { removeStudySession, type StudySession, touchStudySession, useStudySession } from "@/entities/study-session";

import * as React from "react";

type StudyProgress = ReturnType<typeof useStudyProgresses>[number];

export type StudySessionState =
  | { status: "preparing" | "invalid" }
  | { status: "studying"; session: StudySession; card: Card; progress: StudyProgress };

export const useStudySessionState = (
  deckId: DeckId,
  cards: readonly Card[],
  progresses: readonly StudyProgress[]
): StudySessionState => {
  const session = useStudySession(deckId);
  const cardId = session?.cardOrderIds[session.currentIndex];
  const card = cardId == null ? undefined : cards.find(({ id }) => id === cardId);
  const progress = cardId == null ? undefined : progresses.find((item) => item.cardId === cardId);

  let sessionState: StudySessionState;
  if (session == null || cardId == null) sessionState = { status: "invalid" };
  else if (card != null && progress != null) sessionState = { status: "studying", session, card, progress };
  else sessionState = { status: cards.length === 0 || progresses.length === 0 ? "preparing" : "invalid" };

  React.useEffect(() => {
    if (sessionState.status !== "studying") return;
    touchStudySession(deckId);
  }, [deckId, sessionState.status]);

  React.useEffect(() => {
    if (sessionState.status !== "invalid") return;

    // Invalid active progress must be removed before leaving so reopening the deck cannot repeat the same failure.
    removeStudySession(deckId);
  }, [deckId, sessionState.status]);

  return sessionState;
};
