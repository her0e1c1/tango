import { useCardsByDeckId } from "@/entities/card";
import { type Deck, getCategory, isHighlightLanguage } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { selectStudyCards } from "@/entities/study-session";
import type { DeckFilterValues } from "@/features/deck-filter";
import { getDeckViewPosition } from "./getDeckViewPosition";

export function useDeckViewQuery(
  deck: Deck,
  filter: DeckFilterValues,
  cardId: string | undefined,
  showBackText: boolean
) {
  const { cards: deckCards } = useCardsByDeckId(deck.id);
  const preferences = usePreferences();
  const cards = selectStudyCards(deckCards, { ...deck, ...filter }, preferences.study.useCardInterval);
  const { index, card } = getDeckViewPosition(cards, cardId);
  const category = getCategory(deck.category, card?.tags ?? []);
  return {
    cards,
    card,
    current: card === undefined ? 0 : index + 1,
    total: cards.length,
    showBackText: card !== undefined && card.id === cardId && showBackText,
    category,
    code: isHighlightLanguage(category),
    dark: preferences.appearance.darkMode,
  };
}
