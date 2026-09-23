import { filterCardsByTags, useCardsByDeckId } from "@/entities/card";
import { type Deck, getCategory, isHighlightLanguage } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";

import type { DeckFilterValues } from "@/features/deck-filter";

import type { CardListSortOrder, CardListState } from "../store";

interface CardListQueryOptions {
  deck: Deck;
  filter: DeckFilterValues;
  shownCard: CardListState["shownCard"];
  sortOrder: CardListSortOrder;
}

export const useCardListQuery = ({ deck, filter, shownCard, sortOrder }: CardListQueryOptions) => {
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deck.id);
  const matchingCards = filterCardsByTags(deckCards, filter);
  const cards = sortOrder === "newest" ? matchingCards.toSorted((a, b) => b.createdAt - a.createdAt) : matchingCards;
  const rawCount = deckCards.length;
  const visibleCount = cards.length;
  const emptyReason = visibleCount > 0 ? undefined : rawCount === 0 ? ("no-cards" as const) : ("filter-zero" as const);

  const category = shownCard == null ? undefined : getCategory(deck.category, shownCard.tags);
  const answer =
    shownCard == null || category == null
      ? undefined
      : {
          text: shownCard.backText,
          category,
          code: isHighlightLanguage(category),
          dark: preferences.appearance.darkMode,
        };
  return {
    cards,
    rawCount,
    visibleCount,
    emptyReason,
    tags,
    answer,
  };
};
