import { filterCardsByTags, useCards } from "@/entities/card";
import { type Deck, getCategory, isHighlightLanguage } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import type { DeckFilterValues } from "@/features/deck-filter";
import { buildCardPlayerHelpRows } from "@/features/card-player";
import { getDeckViewPosition } from "./getDeckViewPosition";

export function useDeckViewQuery(
  deck: Deck,
  filter: DeckFilterValues,
  cardId: string | undefined,
  showBackText: boolean
) {
  const deckCards = useCards().filter((candidate) => candidate.deckId === deck.id);
  const preferences = usePreferences();
  const cards = filterCardsByTags(deckCards, filter);
  const { index, card } = getDeckViewPosition(cards, cardId);
  const category = getCategory(deck.category, card?.tags ?? []);
  return {
    cards,
    hasCards: deckCards.length > 0,
    card,
    index,
    controls: preferences.controls,
    cardInterval: preferences.study.cardInterval,
    playbackAvailable: preferences.study.cardInterval > 0,
    helpRows: buildCardPlayerHelpRows(
      preferences,
      {
        cardSwipeLeft: "previousCard",
        cardSwipeRight: "GoToNextCard",
        cardSwipeUp: "DoNothing",
        cardSwipeDown: "DoNothing",
      },
      false
    ),
    total: cards.length,
    showBackText: card !== undefined && card.id === cardId && showBackText,
    category,
    code: isHighlightLanguage(category),
    dark: preferences.appearance.darkMode,
  };
}
