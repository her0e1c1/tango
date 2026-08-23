import { countCardsByDeckId, type Card, useCards } from "@/entities/card";
import { type Deck, type DeckId, useDecks } from "@/entities/deck";
import {
  compareActiveDecks,
  groupDecksByStudyStatus,
  type StudySession,
  useStudySessions,
} from "@/entities/study-session";

const compareDeckNames = (left: Deck, right: Deck): number => left.name.localeCompare(right.name);

type StudyProgress = {
  currentIndex: number;
  cardCount: number;
  lastStudiedAt: StudySession["lastStudiedAt"];
};

type DeckListItem = {
  deck: Pick<Deck, "id" | "name" | "category" | "isPublic">;
  cardCount: number;
  studyProgress?: StudyProgress;
};

type StudyingDeckListItem = DeckListItem & {
  studyProgress: StudyProgress;
};

type DeckListSections = {
  studying: StudyingDeckListItem[];
  other: DeckListItem[];
};

const toStudyProgress = (session: StudySession): StudyProgress => ({
  currentIndex: session.currentIndex,
  cardCount: session.cardOrderIds.length,
  lastStudiedAt: session.lastStudiedAt,
});

const buildDeckListSections = (
  decks: Deck[],
  cards: Card[],
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>
): DeckListSections => {
  const cardCounts = countCardsByDeckId(cards);
  const { active, inactive } = groupDecksByStudyStatus(decks, sessionsByDeckId);

  const studying = active.sort(compareActiveDecks).map(({ deck, session }) => ({
    deck,
    cardCount: cardCounts.get(deck.id) ?? 0,
    studyProgress: toStudyProgress(session),
  }));
  const other = inactive.sort(compareDeckNames).map((deck) => ({
    deck,
    cardCount: cardCounts.get(deck.id) ?? 0,
  }));

  return { studying, other };
};

export const useDeckListState = () => {
  const cards = useCards();
  const decks = useDecks();
  const sessionsByDeckId = useStudySessions();

  return {
    sections: buildDeckListSections(decks, cards, sessionsByDeckId),
  };
};

export type DeckListState = ReturnType<typeof useDeckListState>;
