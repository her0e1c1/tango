import type { Card } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";

interface DeckListStudySession {
  status: "studying" | "completed";
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
  const cardCounts = new Map<DeckId, number>();
  for (const card of cards) cardCounts.set(card.deckId, (cardCounts.get(card.deckId) ?? 0) + 1);

  const studying: DeckListItem[] = [];
  const other: DeckListItem[] = [];

  for (const deck of decks) {
    const session = sessionsByDeckId[deck.id];
    const studyingSession = session?.status === "studying" ? session : undefined;
    const item: DeckListItem = {
      deck,
      cardCount: cardCounts.get(deck.id) ?? 0,
      ...(studyingSession == null
        ? {}
        : {
            studyProgress: {
              currentIndex: studyingSession.currentIndex,
              cardCount: studyingSession.cardOrderIds.length,
              lastStudiedAt: studyingSession.lastStudiedAt,
            },
          }),
    };
    if (studyingSession == null) other.push(item);
    else studying.push(item);
  }

  studying.sort(
    (left, right) =>
      (right.studyProgress?.lastStudiedAt ?? 0) - (left.studyProgress?.lastStudiedAt ?? 0) || compareNames(left, right)
  );
  other.sort(compareNames);

  return { studying, other };
};
