import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { StudyProgress } from "@/entities/study-progress";

import * as React from "react";

import { touchStudySession } from "../commands/studySessionCommands";
import { selectStudySessionForRoute } from "../state/studyStore";
import { useStudyHydrated } from "./useStudyHydrated";
import { useStudyStore } from "./useStudyStore";
import type { StudyCard } from "../model/studyCard";

export type ActiveStudySession =
  | { status: "loading" | "unavailable" }
  | {
      status: "ready";
      card: Card;
      progress: StudyProgress;
      index: number;
      numberOfCards: number;
    };

export const useActiveStudySession = (deckId: DeckId, cards: readonly StudyCard[]): ActiveStudySession => {
  const session = useStudyStore(selectStudySessionForRoute(deckId));
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
  const hydrated = useStudyHydrated();
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
    if (!hydrated || session.status === "loading" || exitingDeck.current === deckId) return;

    exitingDeck.current = deckId;
    resetStudy();
    onUnavailable();
  }, [deckId, hydrated, onUnavailable, resetStudy, session.status]);
};
