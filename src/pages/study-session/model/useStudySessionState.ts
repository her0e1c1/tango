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
type VerificationOrigin = "initial" | "retry";

type VerificationState =
  | { key: string; requestId: number; phase: "pending"; origin: VerificationOrigin }
  | {
      key: string;
      requestId: number;
      phase: "settled";
      origin: VerificationOrigin;
      result: RemoteVerification;
    };

interface ActiveVerificationRequest {
  key: string;
  requestId: number;
}

interface VerificationRequestState {
  sequence: number;
  active: ActiveVerificationRequest | undefined;
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
  verification: VerificationState | undefined;
}

type ResolvedPageState =
  | { status: "verifying" }
  | {
      status: "unavailable";
      reason: "local-missing" | "remote-missing" | "remote-tombstoned";
      session: StudySession;
    }
  | { status: "verification-error"; retrying: boolean }
  | { status: "invalid" }
  | { status: "studying"; session: StudySession; card: Card; focusCard: boolean };

export type StudySessionState =
  | { status: "verifying" }
  | {
      status: "unavailable";
      reason: "local-missing" | "remote-missing" | "remote-tombstoned";
      recover: () => boolean;
    }
  | { status: "verification-error"; retrying: boolean; retry: () => void }
  | { status: "invalid" }
  | { status: "studying"; session: StudySession; card: Card; focusCard: boolean };

const combineCardRead = ({ card, progress }: CardRead): Card => ({
  ...card,
  score: progress.score,
  numberOfSeen: progress.numberOfSeen,
  ...(progress.lastSeenAt !== undefined ? { lastSeenAt: progress.lastSeenAt } : {}),
  ...(progress.nextSeeingAt !== undefined ? { nextSeeingAt: progress.nextSeeingAt } : {}),
  ...(progress.interval !== undefined ? { interval: progress.interval } : {}),
});

// The full identity rejects results from replaced sessions even when a later session reuses the same Card.
const verificationKey = (deck: RemoteDeck, sessionId: string, cardId: string): string =>
  [deck.uid, deck.id, sessionId, cardId].join("\u0000");

const resolveRemoteSessionKey = (deck: Deck | undefined, session: StudySession | undefined): string | undefined => {
  if (deck?.localMode !== false || session?.deckId !== deck.id) return;
  const cardId = session.cardOrderIds[session.currentIndex];
  return cardId === undefined ? undefined : verificationKey(deck, session.sessionId, cardId);
};

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
  verification: VerificationState | undefined
): ResolvedPageState => {
  if (verification === undefined) return { status: "verifying" };
  if (verification.phase === "pending") {
    return verification.origin === "retry" ? { status: "verification-error", retrying: true } : { status: "verifying" };
  }
  if (verification.result.status === "missing") {
    return { status: "unavailable", reason: "remote-missing", session: snapshotState.session };
  }
  if (verification.result.status === "tombstoned") {
    return { status: "unavailable", reason: "remote-tombstoned", session: snapshotState.session };
  }
  if (verification.result.status === "error") return { status: "verification-error", retrying: false };
  if (verification.result.read.card.deckId !== deck.id) return { status: "invalid" };

  return {
    status: "studying",
    session: snapshotState.session,
    card: combineCardRead(verification.result.read),
    focusCard: verification.origin === "retry",
  };
};

const resolvePageState = ({
  deck,
  session,
  snapshotState,
  localCardsHydrated,
  verification,
}: PageStateInputs): ResolvedPageState => {
  if (
    deck === undefined ||
    (session !== undefined && session.deckId !== deck.id) ||
    snapshotState.status === "invalid"
  ) {
    return { status: "invalid" };
  }
  if (snapshotState.status === "studying") {
    return {
      status: "studying",
      session: snapshotState.session,
      card: snapshotState.card,
      // A subscription may publish the recovered Card before its single-document Retry settles.
      // Keep the matching Retry identity long enough for the Page to restore focus on either ordering.
      focusCard: verification?.origin === "retry",
    };
  }
  if (deck.localMode) {
    return localCardsHydrated
      ? { status: "unavailable", reason: "local-missing", session: snapshotState.session }
      : { status: "verifying" };
  }
  return resolveRemoteStudyState(deck, snapshotState, verification);
};

const beginVerification = (
  requestState: VerificationRequestState,
  setVerification: React.Dispatch<React.SetStateAction<VerificationState | undefined>>,
  target: RemoteVerificationTarget,
  origin: VerificationOrigin
): void => {
  // The mutable identity closes the same-render double-click window before React can publish pending state.
  if (requestState.active?.key === target.key) return;

  const requestId = requestState.sequence + 1;
  requestState.sequence = requestId;
  requestState.active = { key: target.key, requestId };
  setVerification({ key: target.key, requestId, phase: "pending", origin });

  const settle = (result: RemoteVerification) => {
    const { active } = requestState;
    if (active?.key !== target.key || active.requestId !== requestId) return;

    requestState.active = undefined;
    setVerification({ key: target.key, requestId, phase: "settled", origin, result });
  };

  void fetchRemoteCardRead(target.uid, target.cardId).then(settle, () => settle({ status: "error" }));
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
  const verificationRequest = React.useRef<VerificationRequestState>({ sequence: 0, active: undefined });

  const target = resolveRemoteVerificationTarget(deck, session, snapshotState);
  const targetKey = target?.key;
  const targetUid = target?.uid;
  const targetCardId = target?.cardId;
  const currentSessionKey = resolveRemoteSessionKey(deck, session);
  const currentVerification = verification?.key === currentSessionKey ? verification : undefined;

  React.useEffect(() => {
    const request = verificationRequest.current;
    if (targetKey === undefined || targetUid === undefined || targetCardId === undefined) {
      request.active = undefined;
      return;
    }
    const nextTarget = { key: targetKey, uid: targetUid, cardId: targetCardId };
    beginVerification(request, setVerification, nextTarget, "initial");
    return () => {
      if (request.active?.key === targetKey) request.active = undefined;
    };
  }, [targetCardId, targetKey, targetUid]);

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
    if (invalidSession !== undefined) removeStudySessionIfCurrent(invalidSession);
  }, [invalidSession]);

  if (state.status === "unavailable") {
    return {
      status: state.status,
      reason: state.reason,
      recover: () => removeStudySessionIfCurrent(state.session),
    };
  }
  if (state.status === "verification-error") {
    return {
      status: state.status,
      retrying: state.retrying,
      retry: () => {
        if (target !== undefined) beginVerification(verificationRequest.current, setVerification, target, "retry");
      },
    };
  }
  return state;
};
