import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import {
  findCurrentStudySessionCard,
  removeStudySession,
  type StudySession,
  touchStudySession,
  useStudySession,
} from "@/entities/study-session";

import * as React from "react";

export type StudySessionState =
  | { status: "preparing" | "invalid" }
  | { status: "studying"; session: StudySession; card: Card };

export const useStudySessionState = (deckId: DeckId, cards: readonly Card[]): StudySessionState => {
  const session = useStudySession(deckId);
  const card = findCurrentStudySessionCard(session, cards);

  let sessionState: StudySessionState;
  if (session == null) sessionState = { status: "invalid" };
  else if (card != null) sessionState = { status: "studying", session, card };
  else sessionState = { status: cards.length === 0 ? "preparing" : "invalid" };

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
