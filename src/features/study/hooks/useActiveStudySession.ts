import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { removeStudySession, touchStudySession, useStudySession } from "@/entities/study-session";

import * as React from "react";

export type ActiveStudySession =
  | { status: "loading" | "unavailable" | "completed" }
  | {
      status: "studying";
      card: Card;
      index: number;
      numberOfCards: number;
    };

export const useActiveStudySession = (deckId: DeckId, cards: readonly Card[]): ActiveStudySession => {
  const session = useStudySession(deckId);
  if (session?.status === "completed") return { status: "completed" };

  const index = session?.currentIndex ?? -1;
  const cardId = index >= 0 ? session?.cardOrderIds[index] : undefined;
  const card = cardId == null ? undefined : cards.find(({ id }) => id === cardId);
  const sessionHasTargetCard = session != null && index >= 0 && index < session.cardOrderIds.length;

  if (card != null && sessionHasTargetCard) {
    return { status: "studying", card, index, numberOfCards: session.cardOrderIds.length };
  }
  if (sessionHasTargetCard && cards.length === 0) return { status: "loading" };
  return { status: "unavailable" };
};

export const useStudySessionLifecycle = ({
  deckId,
  session,
  onUnavailable,
}: {
  deckId: DeckId;
  session: ActiveStudySession;
  onUnavailable: () => void;
}) => {
  const exitingDeck = React.useRef<DeckId>(undefined);

  React.useEffect(() => {
    if (session.status !== "studying") return;
    touchStudySession(deckId);
  }, [deckId, session.status]);

  React.useEffect(() => {
    if (session.status === "studying") {
      exitingDeck.current = undefined;
      return;
    }
    if (session.status === "loading" || exitingDeck.current === deckId) return;

    exitingDeck.current = deckId;
    // Completed sessions remain persisted as lifecycle state; unavailable sessions are invalidated.
    if (session.status === "unavailable") removeStudySession(deckId);
    onUnavailable();
  }, [deckId, onUnavailable, session.status]);
};
