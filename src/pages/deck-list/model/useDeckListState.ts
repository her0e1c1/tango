import { countCardsByDeckId, type Card, useCards } from "@/entities/card";
import { type Deck, type DeckId, useDecks } from "@/entities/deck";
import {
  compareActiveDecks,
  groupDecksByStudyStatus,
  type StudySession,
  useStudySessions,
} from "@/entities/study-session";

const compareDeckNames = (left: Deck, right: Deck): number => left.name.localeCompare(right.name);

const buildDeckListSections = (
  decks: Deck[],
  cards: Card[],
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>
) => {
  const cardCounts = countCardsByDeckId(cards);
  const createItem = (deck: Pick<Deck, "id" | "name" | "category" | "isPublic">, session?: StudySession) => ({
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
  });
  const { active: studyingDecks, inactive: otherDecks } = groupDecksByStudyStatus(decks, sessionsByDeckId);
  studyingDecks.sort(compareActiveDecks);
  otherDecks.sort(compareDeckNames);

  return {
    studying: studyingDecks.map(({ deck, session }) => createItem(deck, session)),
    other: otherDecks.map((deck) => createItem(deck)),
  };
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
