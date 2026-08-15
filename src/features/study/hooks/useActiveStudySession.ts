import type { DeckId } from "@/entities/deck";
import { touchStudySession, useStudySession } from "@/entities/study-session";

import * as React from "react";

import type { StudyCard } from "../model/studyCard";
export type ActiveStudySession =
  | { status: "loading" | "unavailable" }
  | {
      status: "ready";
      card: StudyCard["card"];
      progress: StudyCard["progress"];
      index: number;
      numberOfCards: number;
    };

export const useActiveStudySession = (deckId: DeckId, cards: readonly StudyCard[]): ActiveStudySession => {
  const session = useStudySession(deckId);
  const index = session?.currentIndex ?? -1;
  const cardId = index >= 0 ? session?.cardOrderIds[index] : undefined;
  const studyCard = cardId == null ? undefined : cards.find(({ card }) => card.id === cardId);
  const sessionHasTargetCard = session != null && index >= 0 && index < session.cardOrderIds.length;

  if (studyCard != null && sessionHasTargetCard) {
    return {
      status: "ready",
      card: studyCard.card,
      progress: studyCard.progress,
      index,
      numberOfCards: session.cardOrderIds.length,
    };
  }
  if (sessionHasTargetCard && cards.length === 0) return { status: "loading" };
  return { status: "unavailable" };
};

export const useStudySessionLifecycle = ({
  deckId,
  session,
  resetStudy,
  onUnavailable,
}: {
  deckId: DeckId;
  session: ActiveStudySession;
  resetStudy: () => void;
  onUnavailable: () => void;
}) => {
  const exitingDeck = React.useRef<DeckId>(undefined);

  React.useEffect(() => {
    if (session.status !== "ready") return;
    touchStudySession(deckId);
  }, [deckId, session.status]);

  React.useEffect(() => {
    if (session.status === "ready") {
      exitingDeck.current = undefined;
      return;
    }
    if (session.status === "loading" || exitingDeck.current === deckId) return;

    exitingDeck.current = deckId;
    resetStudy();
    onUnavailable();
  }, [deckId, onUnavailable, resetStudy, session.status]);
};
