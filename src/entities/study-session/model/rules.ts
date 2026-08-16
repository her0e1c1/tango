import type { SwipeAction } from "@/entities/preferences/@x/study-session";
import { type CardProgressFields, recordCardStudyProgress } from "@/entities/study-progress/@x/study-session";

import type {
  ResolvedStudySession,
  StudySession,
  StudySessionCard,
  StudySessionMovement,
  StudySessions,
  StudySessionSwipeEffect,
  StudySessionSwipePlan,
} from "./types";

interface StudySessionDeck {
  id: StudySession["deckId"];
}

interface NamedDeck {
  name: string;
}

interface ActiveDeck<TDeck> {
  deck: TDeck;
  session: StudySession;
}

interface DecksByStudyStatus<TDeck> {
  active: ActiveDeck<TDeck>[];
  inactive: TDeck[];
}

const compareDeckNames = (left: NamedDeck, right: NamedDeck): number => left.name.localeCompare(right.name);

export const compareActiveDecks = <TDeck extends NamedDeck>(
  left: ActiveDeck<TDeck>,
  right: ActiveDeck<TDeck>
): number => right.session.lastStudiedAt - left.session.lastStudiedAt || compareDeckNames(left.deck, right.deck);

// Resolve study status here so presentation models cannot redefine which decks have active sessions.
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

const getCurrentStudySessionCardId = (session: StudySession): StudySession["cardOrderIds"][number] | undefined =>
  session.cardOrderIds[session.currentIndex];

export const resolveStudySession = <Card extends StudySessionCard>(
  session: StudySession | undefined,
  cards: readonly Card[]
): ResolvedStudySession<Card> => {
  if (session == null) return { status: "invalid" };

  const cardId = getCurrentStudySessionCardId(session);
  const card = cardId == null ? undefined : cards.find(({ id }) => id === cardId);
  if (card != null) return { status: "studying", session, card };
  // An empty collection can still be an in-flight read; a populated collection proves the persisted card is absent.
  return { status: cardId != null && cards.length === 0 ? "preparing" : "invalid" };
};

const resolveStudySessionSwipeEffect = (swipeAction: SwipeAction): StudySessionSwipeEffect => {
  if (swipeAction === "DoNothing") return "none";
  if (swipeAction === "GoBack") return "exit";
  return swipeAction === "GoToPrevCard" ? "previous" : "next";
};

export const planStudySessionSwipe = (
  session: StudySession | undefined,
  cards: readonly CardProgressFields[],
  swipeAction: SwipeAction,
  studiedAt: number
): StudySessionSwipePlan => {
  if (session == null) return { effect: "none" };

  const effect = resolveStudySessionSwipeEffect(swipeAction);
  if (effect === "none" || effect === "exit") return { effect };

  const resolvedSession = resolveStudySession(session, cards);
  if (resolvedSession.status !== "studying") return { effect: "none" };

  return {
    effect,
    session,
    progress: recordCardStudyProgress(resolvedSession.card, swipeAction, studiedAt),
  };
};

export const isStudySessionPositionUnchanged = (previous: StudySession, current: StudySession | undefined): boolean =>
  // Timestamps may change during a write, but replacements and position changes belong to a newer interaction.
  current?.sessionId === previous.sessionId &&
  current.currentIndex === previous.currentIndex &&
  getCurrentStudySessionCardId(current) === getCurrentStudySessionCardId(previous);

export const calculateStudySessionIndex = (
  session: StudySession,
  movement: StudySessionMovement
): number | undefined => {
  const nextIndex = session.currentIndex + (movement === "previous" ? -1 : 1);
  return nextIndex >= 0 && nextIndex < session.cardOrderIds.length ? nextIndex : undefined;
};

export const calculateStudySessionAutoPlayIndex = (
  session: StudySession | undefined,
  status: ResolvedStudySession<StudySessionCard>["status"],
  autoPlay: boolean,
  cardInterval: number
): number | undefined => {
  if (session == null || status !== "studying" || !autoPlay || cardInterval <= 0) return;
  return calculateStudySessionIndex(session, "next");
};
