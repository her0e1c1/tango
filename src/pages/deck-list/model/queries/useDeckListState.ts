import { countCardsByDeckId, type Card, useCards } from "@/entities/card";
import { type Deck, type DeckId, useDecks } from "@/entities/deck";
import {
  compareActiveDecks,
  groupDecksByStudyStatus,
  type StudySession,
  useStudySessions,
} from "@/entities/study-session";

const compareDeckNames = (left: Deck, right: Deck): number => left.name.localeCompare(right.name);

type DeckListItem = {
  deck: Deck;
  cardCount: number;
  studySession?: StudySession;
};

const buildDeckListSections = (
  decks: Deck[],
  cards: Card[],
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>
) => {
  const cardCounts = countCardsByDeckId(cards);
  const { active, inactive } = groupDecksByStudyStatus(decks, sessionsByDeckId);

  const studying = active.sort(compareActiveDecks).map(({ deck, session }) => ({
    deck,
    cardCount: cardCounts.get(deck.id) ?? 0,
    studySession: session,
  }));
  const other: DeckListItem[] = inactive.sort(compareDeckNames).map((deck) => ({
    deck,
    cardCount: cardCounts.get(deck.id) ?? 0,
  }));

  return { studying, other };
};

export const useDeckListState = () => {
  const cards = useCards();
  const decks = useDecks();
  const sessionsByDeckId = useStudySessions();

  return buildDeckListSections(decks, cards, sessionsByDeckId);
};
