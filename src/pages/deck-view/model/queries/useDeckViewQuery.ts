import { useCardsByDeckId } from "@/entities/card";
import { type Deck, getCategory, isHighlightLanguage } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { useDeadlineQuery } from "@/shared/lib/useDeadlineQuery";
import { selectStudyCardsWithDeadline } from "@/entities/study-session";
import type { DeckFilterValues } from "@/features/deck-filter";
import { buildCardPlayerHelpRows } from "@/features/card-player";
import { getDeckViewPosition } from "./getDeckViewPosition";

export function useDeckViewQuery(
  deck: Deck,
  filter: DeckFilterValues,
  cardId: string | undefined,
  showBackText: boolean
) {
  const { cards: deckCards } = useCardsByDeckId(deck.id);
  const preferences = usePreferences();
  const { cards } = useDeadlineQuery(
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
  const { index, card } = getDeckViewPosition(cards, cardId);
  const category = getCategory(deck.category, card?.tags ?? []);
  return {
    cards,
    card,
    index,
    controls: preferences.controls,
    cardInterval: preferences.study.cardInterval,
    playbackAvailable: preferences.study.cardInterval > 0,
    helpRows: buildCardPlayerHelpRows(preferences, {
      cardSwipeLeft: "previousCard",
      cardSwipeRight: "GoToNextCard",
      cardSwipeUp: "DoNothing",
      cardSwipeDown: "DoNothing",
    }),
    total: cards.length,
    showBackText: card !== undefined && card.id === cardId && showBackText,
    category,
    code: isHighlightLanguage(category),
    dark: preferences.appearance.darkMode,
  };
}
