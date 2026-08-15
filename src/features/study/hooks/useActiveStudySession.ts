import { fetchCardFromServer, type Card, type CardId } from "@/entities/card";
import type { DeckId } from "@/entities/deck";

import * as React from "react";

import { touchStudySession } from "../commands/studySessionCommands";
import { selectStudySessionForRoute } from "../state/studyStore";
import { useStudyHydrated } from "./useStudyHydrated";
import { useStudyStore } from "./useStudyStore";

export type ActiveStudySession =
  | { status: "loading" | "unavailable" }
  | { status: "error"; retry: () => void }
  | {
      status: "ready";
      card: Card;
      index: number;
      numberOfCards: number;
    };

type RemoteCardResult =
  | { cardId?: undefined; status: "idle" }
  | { cardId: CardId; attempt: number; status: "missing" | "error" }
  | { cardId: CardId; attempt: number; status: "found"; card: Card };

const useRemoteStudyCard = (cardId: CardId | undefined, enabled: boolean) => {
  const [attempt, setAttempt] = React.useState(0);
  const [result, setResult] = React.useState<RemoteCardResult>({ status: "idle" });

  React.useEffect(() => {
    if (!enabled || cardId == null) return;

    let cancelled = false;
    void fetchCardFromServer(cardId).then(
      (card) => {
        if (!cancelled) {
          setResult(card == null ? { cardId, attempt, status: "missing" } : { cardId, attempt, status: "found", card });
        }
      },
      () => {
        if (!cancelled) setResult({ cardId, attempt, status: "error" });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [attempt, cardId, enabled]);

  const retry = React.useCallback(() => setAttempt((value) => value + 1), []);
  return { attempt, result, retry };
};

export const useActiveStudySession = (deckId: DeckId, uid: string, cards: readonly Card[]): ActiveStudySession => {
  const session = useStudyStore(selectStudySessionForRoute(deckId));
  const hydrated = useStudyHydrated();
  const index = session?.currentIndex ?? -1;
  const cardId = index >= 0 ? session?.cardOrderIds[index] : undefined;
  const card = cardId == null ? undefined : cards.find(({ id }) => id === cardId);
  const sessionHasTargetCard = session != null && index >= 0 && index < session.cardOrderIds.length;
  const remote = useRemoteStudyCard(cardId, hydrated && sessionHasTargetCard && card == null);

  if (card != null && sessionHasTargetCard) {
    return { status: "ready", card, index, numberOfCards: session.cardOrderIds.length };
  }
  if (!sessionHasTargetCard) return { status: "unavailable" };
  if (
    !hydrated ||
    remote.result.cardId !== cardId ||
    !("attempt" in remote.result) ||
    remote.result.attempt !== remote.attempt
  ) {
    return { status: "loading" };
  }
  if (remote.result.status === "error") return { status: "error", retry: remote.retry };
  if (remote.result.status === "found") {
    const remoteCard = remote.result.card;
    if (remoteCard.deletedAt === null && remoteCard.deckId === deckId && remoteCard.uid === uid) {
      return { status: "ready", card: remoteCard, index, numberOfCards: session.cardOrderIds.length };
    }
  }
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
    if (session.status !== "unavailable") {
      exitingDeck.current = undefined;
      return;
    }
    if (!hydrated || exitingDeck.current === deckId) return;

    exitingDeck.current = deckId;
    resetStudy();
    onUnavailable();
  }, [deckId, hydrated, onUnavailable, resetStudy, session.status]);
};
