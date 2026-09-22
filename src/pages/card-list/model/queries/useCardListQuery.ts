import { useCardsByDeckId } from "@/entities/card";
import { type Deck, getCategory, isHighlightLanguage } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { useDeadlineQuery } from "@/shared/lib/useDeadlineQuery";
import { selectStudyCardsWithDeadline } from "@/entities/study-session";

import type { DeckFilterValues } from "@/features/deck-filter";

import type { CardListSortOrder, CardListState } from "../store";

type CardListEmptyReason = "no-cards" | "filter-zero" | "interval-zero";

interface DeriveCardListEmptyReasonOptions {
  rawCount: number;
  visibleCount: number;
  filterMatchCount: number;
}

function deriveCardListEmptyReason({
  rawCount,
  visibleCount,
  filterMatchCount,
}: DeriveCardListEmptyReasonOptions): CardListEmptyReason | undefined {
  if (visibleCount > 0) return undefined;
  if (rawCount === 0) return "no-cards";
  if (filterMatchCount === 0) return "filter-zero";
  return "interval-zero";
}

interface CardListQueryOptions {
  deck: Deck;
  filter: DeckFilterValues;
  shownCard: CardListState["shownCard"];
  sortOrder: CardListSortOrder;
}

export const useCardListQuery = ({ deck, filter, shownCard, sortOrder }: CardListQueryOptions) => {
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deck.id);
  const { cards: matchingCards } = useDeadlineQuery(selectStudyCardsWithDeadline, [
    deckCards,
    filter,
    preferences.study.useCardInterval,
  ]);
  const cards = sortOrder === "newest" ? matchingCards.toSorted((a, b) => b.createdAt - a.createdAt) : matchingCards;
  const rawCount = deckCards.length;
  const visibleCount = cards.length;
  const filterMatchCount =
    rawCount === 0 || visibleCount > 0
      ? visibleCount
      : selectStudyCardsWithDeadline(deckCards, filter, false, 0).cards.length;
  const emptyReason = deriveCardListEmptyReason({ rawCount, visibleCount, filterMatchCount });

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
