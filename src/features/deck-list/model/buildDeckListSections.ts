import { countCardsByDeckId, type Card } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";

interface DeckListStudySession {
  cardOrderIds: string[];
  currentIndex: number;
  lastStudiedAt: number;
}

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
      ...(session == null
        ? {}
        : {
            studyProgress: {
              currentIndex: session.currentIndex,
              cardCount: session.cardOrderIds.length,
              lastStudiedAt: session.lastStudiedAt,
            },
          }),
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
