import { countCardsByDeckId, type Card } from "@/entities/card";
import { compareDeckNames, type Deck, type DeckId } from "@/entities/deck";
import { summarizeStudySession, type StudySessionSummary } from "@/entities/study-session";

interface DeckListStudySession {
  cardOrderIds: string[];
  currentIndex: number;
  lastStudiedAt: number;
}

export type DeckListStudyProgress = StudySessionSummary;

export interface DeckListItem {
  deck: Deck;
  cardCount: number;
  studyProgress?: DeckListStudyProgress;
}

export interface DeckListSections {
  studying: DeckListItem[];
  other: DeckListItem[];
}

const compareNames = (left: DeckListItem, right: DeckListItem) => compareDeckNames(left.deck, right.deck);

export const buildDeckListSections = (
  decks: Deck[],
  cards: Card[],
  sessionsByDeckId: Partial<Record<DeckId, DeckListStudySession>>
): DeckListSections => {
  const cardCounts = countCardsByDeckId(cards);

  const studying: DeckListItem[] = [];
  const other: DeckListItem[] = [];

  for (const deck of decks) {
    const session = sessionsByDeckId[deck.id];
    const item: DeckListItem = {
      deck,
      cardCount: cardCounts.get(deck.id) ?? 0,
      ...(session == null ? {} : { studyProgress: summarizeStudySession(session) }),
    };
    if (session == null) other.push(item);
    else studying.push(item);
  }

  studying.sort(
    (left, right) =>
      (right.studyProgress?.lastStudiedAt ?? 0) - (left.studyProgress?.lastStudiedAt ?? 0) || compareNames(left, right)
  );
  other.sort(compareNames);

  return { studying, other };
};
