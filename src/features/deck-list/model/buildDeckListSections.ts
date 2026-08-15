import { countCardsByDeckId, type Card } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";
import { groupDecksByStudyStatus, type StudySession } from "@/entities/study-session";

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
  const createItem = (deck: Deck): DeckListItem => ({ deck, cardCount: cardCounts.get(deck.id) ?? 0 });
  const { studying: studyingDecks, notStudying: otherDecks } = groupDecksByStudyStatus(decks, sessionsByDeckId);

  return {
    studying: studyingDecks.map(({ deck, session }) => ({
      ...createItem(deck),
      studyProgress: createDeckListStudyProgress(session),
    })),
    other: otherDecks.map(createItem),
  };
};
