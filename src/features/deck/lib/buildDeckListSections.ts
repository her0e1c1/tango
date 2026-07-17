import type { DeckListItem, DeckListSections } from "@/features/deck/components/templates/DeckListTemplate";
import type { StudySession } from "@/features/study/state/studyStore";

const compareNames = (left: DeckListItem, right: DeckListItem) => left.deck.name.localeCompare(right.deck.name);

export const buildDeckListSections = (
  decks: Deck[],
  cards: Card[],
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>
): DeckListSections => {
  const cardCounts = new Map<DeckId, number>();
  for (const card of cards) cardCounts.set(card.deckId, (cardCounts.get(card.deckId) ?? 0) + 1);

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
