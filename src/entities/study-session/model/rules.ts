import type { SwipeAction } from "@/entities/preferences/@x/study-session";

import type {
  ResolvedStudySession,
  StudySession,
  StudySessionCard,
  StudySessionMovement,
  StudySessions,
  StudySessionSwipeEffect,
} from "./types";

interface StudyStatusDeck {
  id: StudySession["deckId"];
  name: string;
}

interface StudyingDeck<TDeck> {
  deck: TDeck;
  session: StudySession;
}

interface DecksByStudyStatus<TDeck> {
  studying: StudyingDeck<TDeck>[];
  notStudying: TDeck[];
}

const compareDeckNames = (left: StudyStatusDeck, right: StudyStatusDeck): number => left.name.localeCompare(right.name);

const compareStudyingDecks = (left: StudyingDeck<StudyStatusDeck>, right: StudyingDeck<StudyStatusDeck>): number =>
  right.session.lastStudiedAt - left.session.lastStudiedAt || compareDeckNames(left.deck, right.deck);

// Keep session-based status and ordering together so presentation models cannot redefine which decks are being studied.
export const groupDecksByStudyStatus = <TDeck extends StudyStatusDeck>(
  decks: readonly TDeck[],
  sessionsByDeckId: StudySessions
): DecksByStudyStatus<TDeck> => {
  const studying: StudyingDeck<TDeck>[] = [];
  const notStudying: TDeck[] = [];

  for (const deck of decks) {
    const session = sessionsByDeckId[deck.id];
    if (session == null) notStudying.push(deck);
    else studying.push({ deck, session });
  }

  studying.sort(compareStudyingDecks);
  notStudying.sort(compareDeckNames);

  return { studying, notStudying };
};

export const getCurrentStudySessionCardId = (session: StudySession): StudySession["cardOrderIds"][number] | undefined =>
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

export const resolveStudySessionSwipeEffect = (swipeAction: SwipeAction): StudySessionSwipeEffect => {
  if (swipeAction === "DoNothing") return "none";
  if (swipeAction === "GoBack") return "exit";
  return swipeAction === "GoToPrevCard" ? "previous" : "next";
};

export const isStudySessionPositionUnchanged = (previous: StudySession, current: StudySession | undefined): boolean =>
  // Persistence timestamps may change during a write, but a position change means another interaction owns the card.
  current?.currentIndex === previous.currentIndex &&
  getCurrentStudySessionCardId(current) === getCurrentStudySessionCardId(previous);

export const calculateStudySessionIndex = (
  session: StudySession,
  movement: StudySessionMovement
): number | undefined => {
  const nextIndex = session.currentIndex + (movement === "previous" ? -1 : 1);
  return nextIndex >= 0 && nextIndex < session.cardOrderIds.length ? nextIndex : undefined;
};
