/**
 * @file Provides deck feature rules for Build Deck List Sections.
 * Keeping these calculations outside React makes their inputs, outputs, and edge cases easier to
 * understand and test.
 */

import type { DeckListItem, DeckListSections } from "@/features/deck/components/templates/DeckListTemplate";
import type { StudySession } from "@/features/study/state/studyStore";

/**
 * Orders two deck-list items alphabetically by deck name.
 * The named comparison keeps the inactive-deck section stable and easy to scan.
 */
const compareNames = (left: DeckListItem, right: DeckListItem) => left.deck.name.localeCompare(right.deck.name);

/**
 * Builds deck list sections from the supplied application values.
 * The returned value is ready for the next layer, so callers do not need to repeat assembly or
 * defaulting rules.
 */
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
