import { type Card, type CardRead, fetchRemoteCardRead, type RemoteCardReadResult } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import {
  removeStudySessionIfCurrent,
  resolveStudySession,
  type StudySession,
  touchStudySession,
  useStudySession,
} from "@/entities/study-session";

import * as React from "react";

type RemoteVerification = RemoteCardReadResult | { status: "error" };

interface VerificationState {
  key: string;
  result: RemoteVerification;
}

type RemoteDeck = Extract<Deck, { localMode: false }>;
type SnapshotState = ReturnType<typeof resolveStudySession<Card>>;
type AbsentSnapshotState = Extract<SnapshotState, { status: "absent" }>;

interface RemoteVerificationTarget {
  uid: string;
  cardId: string;
  key: string;
}

interface PageStateInputs {
  deck: Deck | undefined;
  session: StudySession | undefined;
  snapshotState: SnapshotState;
  localCardsHydrated: boolean;
  verification: RemoteVerification | undefined;
}

export type StudySessionState =
  | { status: "verifying" }
  | { status: "unavailable"; reason: "local-missing" | "remote-missing" | "remote-tombstoned" }
  | { status: "verification-error" }
  | { status: "invalid" }
  | { status: "studying"; session: StudySession; card: Card };

const combineCardRead = ({ card, progress }: CardRead): Card => ({
  ...card,
  score: progress.score,
  numberOfSeen: progress.numberOfSeen,
  ...(progress.lastSeenAt !== undefined ? { lastSeenAt: progress.lastSeenAt } : {}),
  ...(progress.nextSeeingAt !== undefined ? { nextSeeingAt: progress.nextSeeingAt } : {}),
  ...(progress.interval !== undefined ? { interval: progress.interval } : {}),
});

// Keep the full target key and effect cancellation together: the key rejects stored results for superseded
// sessions, while cancellation prevents their still-pending reads from publishing after identity changes.
const verificationKey = (deck: RemoteDeck, sessionId: string, cardId: string): string =>
  [deck.uid, deck.id, sessionId, cardId].join("\u0000");

const belongsToDeckPersistence = (card: Card, deck: Deck): boolean =>
  card.deckId === deck.id && (deck.localMode ? !("uid" in card) : "uid" in card && card.uid === deck.uid);

const resolveRemoteVerificationTarget = (
  deck: Deck | undefined,
  session: StudySession | undefined,
  snapshotState: SnapshotState
): RemoteVerificationTarget | undefined => {
  if (deck?.localMode !== false || session?.deckId !== deck.id || snapshotState.status !== "absent") return;

  return {
    uid: deck.uid,
    cardId: snapshotState.cardId,
    key: verificationKey(deck, snapshotState.session.sessionId, snapshotState.cardId),
  };
};

const resolveRemoteStudyState = (
  deck: RemoteDeck,
  snapshotState: AbsentSnapshotState,
  verification: RemoteVerification | undefined
): StudySessionState => {
  if (verification === undefined) return { status: "verifying" };
  if (verification.status === "missing") return { status: "unavailable", reason: "remote-missing" };
  if (verification.status === "tombstoned") return { status: "unavailable", reason: "remote-tombstoned" };
  if (verification.status === "error") return { status: "verification-error" };
  if (verification.read.card.deckId !== deck.id) return { status: "invalid" };

  return {
    status: "studying",
    session: snapshotState.session,
    card: combineCardRead(verification.read),
  };
};

const resolvePageState = ({
  deck,
  session,
  snapshotState,
  localCardsHydrated,
  verification,
}: PageStateInputs): StudySessionState => {
  if (
    deck === undefined ||
    (session !== undefined && session.deckId !== deck.id) ||
    snapshotState.status === "invalid"
  ) {
    return { status: "invalid" };
  }
  if (snapshotState.status === "studying") {
    return { status: "studying", session: snapshotState.session, card: snapshotState.card };
  }
  if (deck.localMode) {
    return localCardsHydrated ? { status: "unavailable", reason: "local-missing" } : { status: "verifying" };
  }
  return resolveRemoteStudyState(deck, snapshotState, verification);
};

export const useStudySessionState = (
  deck: Deck | undefined,
  cards: readonly Card[],
  localCardsHydrated: boolean
): StudySessionState => {
  const session = useStudySession(deck?.id ?? "");
  const scopedCards = deck === undefined ? [] : cards.filter((card) => belongsToDeckPersistence(card, deck));
  const snapshotState = resolveStudySession(session, scopedCards);
  const [verification, setVerification] = React.useState<VerificationState>();

  const target = resolveRemoteVerificationTarget(deck, session, snapshotState);
  const targetUid = target?.uid;
  const targetCardId = target?.cardId;
  const currentVerificationKey = target?.key;
  const currentVerification =
    verification !== undefined && verification.key === currentVerificationKey ? verification.result : undefined;

  React.useEffect(() => {
    if (targetUid === undefined || targetCardId === undefined || currentVerificationKey === undefined) return;

    let current = true;
    void fetchRemoteCardRead(targetUid, targetCardId).then(
      (result) => {
        if (current) setVerification({ key: currentVerificationKey, result });
      },
      () => {
        if (current) setVerification({ key: currentVerificationKey, result: { status: "error" } });
      }
    );
    return () => {
      current = false;
    };
  }, [currentVerificationKey, targetCardId, targetUid]);

  const state = resolvePageState({
    deck,
    session,
    snapshotState,
    localCardsHydrated,
    verification: currentVerification,
  });

  const studyingDeckId = state.status === "studying" ? state.session.deckId : undefined;
  const studyingSessionId = state.status === "studying" ? state.session.sessionId : undefined;

  React.useEffect(() => {
    if (studyingDeckId !== undefined) touchStudySession(studyingDeckId);
  }, [studyingDeckId, studyingSessionId]);

  const invalidSession = state.status === "invalid" && deck !== undefined ? session : undefined;
  React.useEffect(() => {
    if (invalidSession === undefined) return;

    removeStudySessionIfCurrent(invalidSession);
  }, [invalidSession]);

  return state;
};
