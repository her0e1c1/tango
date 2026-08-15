import { countCardsByDeckId, type Card } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";
import type { StudySession } from "@/entities/study-session";

export interface DeckListStudyProgress {
  currentIndex: number;
  cardCount: number;
  lastStudiedAt: number;
}

export interface DeckListItem {
  deck: Deck;
  cardCount: number;
  studyProgress?: DeckListStudyProgress;
}

export interface DeckListSections {
  studying: DeckListItem[];
  other: DeckListItem[];
}

const compareNames = (left: DeckListItem, right: DeckListItem) => left.deck.name.localeCompare(right.deck.name);

const createDeckListStudyProgress = (session: StudySession): DeckListStudyProgress => ({
  currentIndex: session.currentIndex,
  cardCount: session.cardOrderIds.length,
  lastStudiedAt: session.lastStudiedAt,
});

export const buildDeckListSections = (
  decks: Deck[],
  cards: Card[],
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>
): DeckListSections => {
  const cardCounts = countCardsByDeckId(cards);
  const items = decks.map((deck): DeckListItem => {
    const session = sessionsByDeckId[deck.id];

    return {
      deck,
      cardCount: cardCounts.get(deck.id) ?? 0,
      ...(session == null ? {} : { studyProgress: createDeckListStudyProgress(session) }),
    };
  });

  const studying = items
    .filter((item) => item.studyProgress != null)
    .sort(
      (left, right) =>
        (right.studyProgress?.lastStudiedAt ?? 0) - (left.studyProgress?.lastStudiedAt ?? 0) ||
        compareNames(left, right)
    );
  const other = items.filter((item) => item.studyProgress == null).sort(compareNames);

  return { studying, other };
};
