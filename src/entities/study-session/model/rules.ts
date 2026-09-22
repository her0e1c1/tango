import { classifyFsrsState, type FsrsState } from "@/entities/card-study-state/@x/study-session";
import { isDeckTagSelectionMatching } from "@/entities/deck/@x/study-session";

import type { ResolvedStudySession, StudySession, StudySessionCard } from "./types";

/** Card fields needed to decide whether the Card belongs in a study session. */
interface StudyCardSelectionCard {
  fsrs: FsrsState | null;
  tags: readonly string[];
}

/** Deck-owned filters that define the study-session candidate set. */
interface StudyCardSelectionDeck {
  selectedTags: readonly string[];
  tagAndFilter: boolean;
}

// Eligibility stays in input order; only session creation applies order, shuffle and limits.
export function selectStudyCardsWithDeadline<TCard extends StudyCardSelectionCard>(
  cards: readonly TCard[],
  deck: StudyCardSelectionDeck,
  useCardInterval: boolean,
  now: number
): { cards: TCard[]; nextDueAt: number | undefined } {
  const selected: TCard[] = [];
  let nextDueAt: number | undefined;
  for (const card of cards) {
    if (!isDeckTagSelectionMatching(card.tags, deck.selectedTags, deck.tagAndFilter)) continue;
    const timing = classifyFsrsState(card.fsrs, now);
    if (useCardInterval && timing.status === "future") {
      nextDueAt = nextDueAt === undefined ? timing.dueAt : Math.min(nextDueAt, timing.dueAt);
    } else selected.push(card);
  }
  return { cards: selected, nextDueAt };
}

export function selectStudyCards<TCard extends StudyCardSelectionCard>(
  cards: readonly TCard[],
  deck: StudyCardSelectionDeck,
  useCardInterval: boolean,
  now = Date.now()
): TCard[] {
  return selectStudyCardsWithDeadline(cards, deck, useCardInterval, now).cards;
}

// Reads the Card id at the session cursor, returning undefined for an empty or out-of-range position.
const getCurrentStudySessionCardId = (session: StudySession): StudySession["cardOrderIds"][number] | undefined =>
  session.cardOrderIds[session.currentIndex];

// Resolves whether an active session can study now, is waiting for Cards, or is invalid.
export const resolveStudySession = <Card extends StudySessionCard>(
  session: StudySession | undefined,
  cards: readonly Card[]
): ResolvedStudySession<Card> => {
  if (session == null) return { status: "invalid" };

  const cardId = getCurrentStudySessionCardId(session);
  if (cardId == null) return { status: "invalid" };

  const card = cards.find(({ id }) => id === cardId);
  if (card != null) return { status: "studying", session, card };

  // An empty collection can still be an in-flight read; loaded Cards prove that the persisted Card is absent.
  return { status: cards.length === 0 ? "preparing" : "invalid" };
};

// Confirms interaction identity and position while ignoring timestamps that may change during the same write.
export const isStudySessionPositionUnchanged = (previous: StudySession, current: StudySession | undefined): boolean =>
  current?.sessionId === previous.sessionId &&
  current.currentIndex === previous.currentIndex &&
  getCurrentStudySessionCardId(current) === getCurrentStudySessionCardId(previous);

// Computes the next valid cursor; undefined signals that movement crossed a boundary and should end the session.
export const calculateStudySessionIndex = (session: StudySession): number | undefined => {
  const nextIndex = session.currentIndex + 1;
  return nextIndex >= 0 && nextIndex < session.cardOrderIds.length ? nextIndex : undefined;
};

// Reports whether another Card remains after the current position.
export const canMoveStudySession = (session: StudySession): boolean =>
  calculateStudySessionIndex(session) !== undefined;

// Server creation time orders runs across devices without confusing it with domain or recent-study time.
export function compareStudySessionCreation(left: StudySession, right: StudySession): number {
  return (left.remote.createdAt ?? 0) - (right.remote.createdAt ?? 0) || left.sessionId.localeCompare(right.sessionId);
}
