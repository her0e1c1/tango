import { isDeckTagSelectionMatching } from "@/entities/deck/@x/study-session";
import type { SwipeAction } from "@/entities/preference/@x/study-session";
import {
  classifyStudyProgress,
  type CardProgressFields,
  type StudyRating,
  createStudyProgressFromCard,
  isStudyProgressEligible,
} from "@/entities/study-progress/@x/study-session";

import type {
  ResolvedStudySession,
  StudySession,
  StudySessionCard,
  StudySessions,
  StudySessionSwipeEffect,
  StudySessionSwipePlan,
} from "./types";

/** Minimal Deck identity needed to look up a study session. */
interface StudySessionDeck {
  id: StudySession["deckId"];
}

/** Deck display name needed for deterministic ordering. */
interface NamedDeck {
  name: string;
}

/** Deck paired with its currently active study session. */
interface ActiveDeck<TDeck> {
  deck: TDeck;
  session: StudySession;
}

/** Partition of Decks with and without active study sessions. */
interface DecksByStudyStatus<TDeck> {
  active: ActiveDeck<TDeck>[];
  inactive: TDeck[];
}

/** Card fields needed to decide whether the Card belongs in a study session. */
interface StudyCardSelectionCard extends CardProgressFields {
  tags: readonly string[];
}

/** Deck-owned filters that define the study-session candidate set. */
interface StudyCardSelectionDeck {
  difficultyMax: number | null;
  difficultyMin: number | null;
  selectedTags: readonly string[];
  tagAndFilter: boolean;
}

// Compares Deck names with locale-aware ascending order for deterministic presentation ties.
const compareDeckNames = (left: NamedDeck, right: NamedDeck): number => left.name.localeCompare(right.name);

// Orders active Decks by most recent study time, then alphabetically when their timestamps match.
export const compareActiveDecks = <TDeck extends NamedDeck>(
  left: ActiveDeck<TDeck>,
  right: ActiveDeck<TDeck>
): number => right.session.lastStudiedAt - left.session.lastStudiedAt || compareDeckNames(left.deck, right.deck);

// Partitions Decks by session presence so presentation models cannot redefine which Decks are actively studied.
export const groupDecksByStudyStatus = <TDeck extends StudySessionDeck>(
  decks: readonly TDeck[],
  sessionsByDeckId: StudySessions
): DecksByStudyStatus<TDeck> => {
  const active: ActiveDeck<TDeck>[] = [];
  const inactive: TDeck[] = [];

  for (const deck of decks) {
    const session = sessionsByDeckId[deck.id];
    if (session == null) inactive.push(deck);
    else active.push({ deck, session });
  }

  return { active, inactive };
};

// Eligibility stays in input order; only session creation applies order, shuffle and limits.
export function selectStudyCardsWithDeadline<TCard extends StudyCardSelectionCard>(
  cards: readonly TCard[],
  deck: StudyCardSelectionDeck,
  respectNextSeeingAt: boolean,
  now: number
): { cards: TCard[]; nextDueAt: number | undefined } {
  const selected: TCard[] = [];
  let nextDueAt: number | undefined;
  for (const card of cards) {
    if (!isDeckTagSelectionMatching(card.tags, deck.selectedTags, deck.tagAndFilter)) continue;
    const progress = createStudyProgressFromCard(card);
    if (
      !isStudyProgressEligible(
        progress,
        {
          maximumDifficulty: deck.difficultyMax,
          minimumDifficulty: deck.difficultyMin,
          respectNextSeeingAt: false,
        },
        now
      )
    )
      continue;
    const timing = classifyStudyProgress(progress, now);
    if (respectNextSeeingAt && timing.status === "future") {
      nextDueAt = nextDueAt === undefined ? timing.dueAt : Math.min(nextDueAt, timing.dueAt);
    } else selected.push(card);
  }
  return { cards: selected, nextDueAt };
}

export function selectStudyCards<TCard extends StudyCardSelectionCard>(
  cards: readonly TCard[],
  deck: StudyCardSelectionDeck,
  respectNextSeeingAt: boolean,
  now = Date.now()
): TCard[] {
  return selectStudyCardsWithDeadline(cards, deck, respectNextSeeingAt, now).cards;
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

// Collapses control actions into the movement, exit, or no-op effects understood by a study session.
const resolveStudySessionSwipeEffect = (swipeAction: SwipeAction): StudySessionSwipeEffect => {
  if (swipeAction === "DoNothing") return "none";
  if (swipeAction === "GoBack") return "exit";
  return "next";
};

const ratings: Partial<Record<SwipeAction, StudyRating>> = {
  RateAgain: "again",
  RateHard: "hard",
  RateGood: "good",
  RateEasy: "easy",
};

// Resolves the action and rating only when the current session and Card still exist.
export const planStudySessionSwipe = (
  session: StudySession | undefined,
  cards: readonly StudySessionCard[],
  swipeAction: SwipeAction
): StudySessionSwipePlan => {
  if (session == null) return { effect: "none" };

  const effect = resolveStudySessionSwipeEffect(swipeAction);
  if (effect === "none" || effect === "exit") return { effect };

  const resolvedSession = resolveStudySession(session, cards);
  if (resolvedSession.status !== "studying") return { effect: "none" };

  return {
    effect,
    rating: ratings[swipeAction],
  };
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
