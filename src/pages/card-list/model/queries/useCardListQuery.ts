import { useCardsByDeckId } from "@/entities/card";
import { type Deck, getCategory, isHighlightLanguage } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { MAX_DIFFICULTY, MIN_DIFFICULTY } from "@/entities/study-progress";
import { useDeadlineQuery } from "@/shared/lib/useDeadlineQuery";
import { selectStudyCardsWithDeadline } from "@/entities/study-session";

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
  const { cards: matchingCards } = useDeadlineQuery(
    (now) => selectStudyCardsWithDeadline(deckCards, filter, preferences.study.useCardInterval, now),
    [
      deckCards,
      filter.difficultyMin,
      filter.difficultyMax,
      filter.selectedTags,
      filter.tagAndFilter,
      preferences.study.useCardInterval,
    ]
  );
  const cards = sortOrder === "newest" ? matchingCards.toSorted((a, b) => b.createdAt - a.createdAt) : matchingCards;
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
    tags,
    answer,
    bulkDifficultyMaximum: MAX_DIFFICULTY,
    bulkDifficultyMinimum: MIN_DIFFICULTY,
  };
};
