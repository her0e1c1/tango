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

const compareDeckNames = (left: Deck, right: Deck): number => left.name.localeCompare(right.name);

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
  const { active: studyingDecks, inactive: otherDecks } = groupDecksByStudyStatus(decks, sessionsByDeckId);
  studyingDecks.sort(
    (left, right) => right.session.lastStudiedAt - left.session.lastStudiedAt || compareDeckNames(left.deck, right.deck)
  );
  otherDecks.sort(compareDeckNames);

  return {
    studying: studyingDecks.map(({ deck, session }) => ({
      ...createItem(deck),
      studyProgress: createDeckListStudyProgress(session),
    })),
    other: otherDecks.map(createItem),
  };
};
