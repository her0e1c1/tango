import { countCardsByDeckId, type Card } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";
import { compareActiveDecks, groupDecksByStudyStatus, type StudySession } from "@/entities/study-session";

const compareDeckNames = (left: Deck, right: Deck): number => left.name.localeCompare(right.name);

const toDeckListStudyProgress = (session: StudySession) => ({
  currentIndex: session.currentIndex,
  cardCount: session.cardOrderIds.length,
  lastStudiedAt: session.lastStudiedAt,
});

export const buildDeckListSections = (
  decks: Deck[],
  cards: Card[],
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>
) => {
  const cardCountsByDeckId = countCardsByDeckId(cards);
  const toDeckListItem = (
    deck: Pick<Deck, "id" | "name" | "category" | "isPublic">,
    studyProgress?: ReturnType<typeof toDeckListStudyProgress>
  ) => ({
    deck,
    cardCount: cardCountsByDeckId.get(deck.id) ?? 0,
    ...(studyProgress == null ? {} : { studyProgress }),
  });
  const { active: studyingDecks, inactive: otherDecks } = groupDecksByStudyStatus(decks, sessionsByDeckId);

  studyingDecks.sort(compareActiveDecks);
  otherDecks.sort(compareDeckNames);

  return {
    studying: studyingDecks.map(({ deck, session }) => toDeckListItem(deck, toDeckListStudyProgress(session))),
    other: otherDecks.map((deck) => toDeckListItem(deck)),
  };
};
