import { type Card, useCardsByDeckId } from "@/entities/card";
import { type Deck, getCategory, isHighlightLanguage } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { MAX_DIFFICULTY, MIN_DIFFICULTY } from "@/entities/study-progress";
import { selectStudyCards } from "@/entities/study-session";

import type { CardListSortOrder } from "../store";

export const useCardListQuery = (deck: Deck, shownCard: Card | undefined, sortOrder: CardListSortOrder) => {
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deck.id);
  const matchingCards = selectStudyCards(deckCards, deck, preferences.study.useCardInterval);
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
