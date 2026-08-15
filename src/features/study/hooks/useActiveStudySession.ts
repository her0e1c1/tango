import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";

import * as React from "react";

import { touchStudySession } from "../commands/studySessionCommands";
import { selectStudySessionForRoute } from "../state/studyStore";
import { useStudyStore } from "./useStudyStore";

export type ActiveStudySession =
  | { status: "loading" | "unavailable" }
  | {
      status: "ready";
      card: Card;
      index: number;
      numberOfCards: number;
    };

export const useActiveStudySession = (deckId: DeckId, cards: readonly Card[]): ActiveStudySession => {
  const session = useStudyStore(selectStudySessionForRoute(deckId));
  const index = session?.currentIndex ?? -1;
  const cardId = index >= 0 ? session?.cardOrderIds[index] : undefined;
  const card = cardId == null ? undefined : cards.find(({ id }) => id === cardId);
  const sessionHasTargetCard = session != null && index >= 0 && index < session.cardOrderIds.length;

  if (card != null && sessionHasTargetCard) {
    return { status: "ready", card, index, numberOfCards: session.cardOrderIds.length };
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
