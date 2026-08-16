import type { SwipeAction } from "@/entities/preferences/@x/study-session";
import { type CardProgressFields, recordCardStudyProgress } from "@/entities/study-progress/@x/study-session";

import type {
  StudySession,
  StudySessionCard,
  StudySessionMovement,
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

// Reads the Card id at the session cursor, returning undefined for an empty or out-of-range position.
const getCurrentStudySessionCardId = (session: StudySession): StudySession["cardOrderIds"][number] | undefined =>
  session.cardOrderIds[session.currentIndex];

// Finds the loaded Card at the active session position without inferring application loading state.
export const findCurrentStudySessionCard = <Card extends StudySessionCard>(
  session: StudySession | undefined,
  cards: readonly Card[]
): Card | undefined => {
  if (session == null) return;
  const cardId = getCurrentStudySessionCardId(session);
  return cardId == null ? undefined : cards.find(({ id }) => id === cardId);
};

// Collapses control actions into the movement, exit, or no-op effects understood by a study session.
const resolveStudySessionSwipeEffect = (swipeAction: SwipeAction): StudySessionSwipeEffect => {
  if (swipeAction === "DoNothing") return "none";
  if (swipeAction === "GoBack") return "exit";
  return swipeAction === "GoToPrevCard" ? "previous" : "next";
};

// Plans a swipe without mutation and emits progress only when the current session and Card still resolve.
export const planStudySessionSwipe = (
  session: StudySession | undefined,
  cards: readonly CardProgressFields[],
  swipeAction: SwipeAction,
  studiedAt: number
): StudySessionSwipePlan => {
  if (session == null) return { effect: "none" };

  const effect = resolveStudySessionSwipeEffect(swipeAction);
  if (effect === "none" || effect === "exit") return { effect };

  const card = findCurrentStudySessionCard(session, cards);
  if (card == null) return { effect: "none" };

  return {
    effect,
    session,
    progress: recordCardStudyProgress(card, swipeAction, studiedAt),
  };
};

// Confirms interaction identity and position while ignoring timestamps that may change during the same write.
export const isStudySessionPositionUnchanged = (previous: StudySession, current: StudySession | undefined): boolean =>
  current?.sessionId === previous.sessionId &&
  current.currentIndex === previous.currentIndex &&
  getCurrentStudySessionCardId(current) === getCurrentStudySessionCardId(previous);

// Computes the next valid cursor; undefined signals that movement crossed a boundary and should end the session.
export const calculateStudySessionIndex = (
  session: StudySession,
  movement: StudySessionMovement
): number | undefined => {
  const nextIndex = session.currentIndex + (movement === "previous" ? -1 : 1);
  return nextIndex >= 0 && nextIndex < session.cardOrderIds.length ? nextIndex : undefined;
};

// Reports whether the session can move without crossing either end of its Card order.
export const canMoveStudySession = (session: StudySession, movement: StudySessionMovement): boolean =>
  calculateStudySessionIndex(session, movement) !== undefined;
