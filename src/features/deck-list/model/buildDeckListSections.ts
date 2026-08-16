import { countCardsByDeckId, type Card } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";
import { compareActiveDecks, groupDecksByStudyStatus, type StudySession } from "@/entities/study-session";

export interface DeckListStudyProgress {
  currentIndex: number;
  cardCount: number;
  lastStudiedAt: number;
}

export interface DeckListDeck {
  id: string;
  name: string;
  category: string;
  isPublic: boolean;
}

export interface DeckListItem {
  deck: DeckListDeck;
  cardCount: number;
  studyProgress?: DeckListStudyProgress;
}

export interface DeckListSections {
  studying: DeckListItem[];
  other: DeckListItem[];
}

const compareDeckNames = (left: Deck, right: Deck): number => left.name.localeCompare(right.name);

const createDeckListStudyProgress = (session: StudySession): DeckListStudyProgress => ({
  currentIndex: session.currentIndex,
  cardCount: session.cardOrderIds.length,
  lastStudiedAt: session.lastStudiedAt,
});

const createDeckListDeck = (deck: Deck): DeckListDeck => ({
  id: deck.id,
  name: deck.name,
  category: deck.category,
  isPublic: deck.isPublic,
});

export const buildDeckListSections = (
  decks: Deck[],
  cards: Card[],
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>
): DeckListSections => {
  const cardCounts = countCardsByDeckId(cards);
  const createItem = (deck: Deck): DeckListItem => ({
    deck: createDeckListDeck(deck),
    cardCount: cardCounts.get(deck.id) ?? 0,
  });
  const { active: studyingDecks, inactive: otherDecks } = groupDecksByStudyStatus(decks, sessionsByDeckId);
  studyingDecks.sort(compareActiveDecks);
  otherDecks.sort(compareDeckNames);

  return {
    studying: studyingDecks.map(({ deck, session }) => ({
      ...createItem(deck),
      studyProgress: createDeckListStudyProgress(session),
    })),
    other: otherDecks.map(createItem),
  };
};
