import { useAuthUid } from "@/entities/auth";
import { fetchCardFromServer, type Card, type CardId } from "@/entities/card";
import type { DeckId } from "@/entities/deck";

import * as React from "react";

import { touchStudySession } from "../commands/studySessionCommands";
import { selectStudySessionForRoute } from "../state/studyStore";
import { useStudyHydrated } from "./useStudyHydrated";
import { useStudyStore } from "./useStudyStore";

export type ActiveStudySession =
  | { status: "loading" }
  | { status: "unavailable"; reason: "missing-session" | "missing-card" }
  | { status: "error"; reason: "card-verification-failed"; retry: () => void }
  | {
      status: "active";
      card: Card;
      index: number;
      cardOrderIds: CardId[];
    };

type Verification =
  | { key: string; status: "loading" }
  | { key: string; status: "available"; card: Card }
  | { key: string; status: "missing" }
  | { key: string; status: "error" };

const isSessionCard = (card: Card, cardId: CardId, deckId: DeckId, uid: string) =>
  card.id === cardId && card.deckId === deckId && card.uid === uid && card.deletedAt === null;

const resolveVerifiedSession = (
  verificationKey: string | undefined,
  verification: Verification | undefined,
  session: NonNullable<ReturnType<ReturnType<typeof selectStudySessionForRoute>>>,
  index: number
): ActiveStudySession => {
  if (verificationKey == null || verification?.key !== verificationKey || verification.status === "loading") {
    return { status: "loading" };
  }
  if (verification.status === "error") {
    return { status: "error", reason: "card-verification-failed", retry: () => undefined };
  }
  if (verification.status === "missing") return { status: "unavailable", reason: "missing-card" };
  return { status: "active", card: verification.card, index, cardOrderIds: [...session.cardOrderIds] };
};

export const useActiveStudySession = (deckId: DeckId, cards: readonly Card[]): ActiveStudySession => {
  const uid = useAuthUid();
  const hydrated = useStudyHydrated();
  const session = useStudyStore(selectStudySessionForRoute(deckId));
  const [retryAttempt, setRetryAttempt] = React.useState(0);
  const [verification, setVerification] = React.useState<Verification | undefined>(undefined);
  const index = session?.currentIndex ?? -1;
  const cardId = index >= 0 ? session?.cardOrderIds[index] : undefined;
  const localCard = cardId == null ? undefined : cards.find(({ id }) => id === cardId);
  const validTarget = session != null && cardId != null && index >= 0 && index < session.cardOrderIds.length;
  const verifiedLocalCard =
    localCard != null && cardId != null && isSessionCard(localCard, cardId, deckId, uid) ? localCard : undefined;
  const verificationKey =
    validTarget && verifiedLocalCard == null ? `${uid}:${deckId}:${cardId}:${retryAttempt}` : undefined;

  React.useEffect(() => {
    if (!hydrated || verificationKey == null || cardId == null) return;
    let current = true;
    void fetchCardFromServer(cardId)
      .then((card) => {
        if (!current) return;
        setVerification(
          card != null && isSessionCard(card, cardId, deckId, uid)
            ? { key: verificationKey, status: "available", card }
            : { key: verificationKey, status: "missing" }
        );
      })
      .catch(() => {
        if (current) setVerification({ key: verificationKey, status: "error" });
      });
    return () => {
      current = false;
    };
  }, [cardId, deckId, hydrated, uid, verificationKey]);

  if (!hydrated) return { status: "loading" };
  if (!validTarget || session == null) return { status: "unavailable", reason: "missing-session" };
  if (verifiedLocalCard != null) {
    return { status: "active", card: verifiedLocalCard, index, cardOrderIds: [...session.cardOrderIds] };
  }
  const result = resolveVerifiedSession(verificationKey, verification, session, index);
  return result.status === "error" ? { ...result, retry: () => setRetryAttempt((attempt) => attempt + 1) } : result;
};

export const useStudySessionLifecycle = ({
  deckId,
  session,
  resetStudy,
}: {
  deckId: DeckId;
  session: ActiveStudySession;
  resetStudy: () => void;
}) => {
  const removedStaleCard = React.useRef<string>(undefined);

  React.useEffect(() => {
    if (session.status !== "active") return;
    removedStaleCard.current = undefined;
    touchStudySession(deckId);
  }, [deckId, session.status]);

  React.useEffect(() => {
    if (session.status !== "unavailable" || session.reason !== "missing-card") return;
    const staleCard = `${deckId}:${session.reason}`;
    if (removedStaleCard.current === staleCard) return;
    removedStaleCard.current = staleCard;
    resetStudy();
  }, [deckId, resetStudy, session]);
};
