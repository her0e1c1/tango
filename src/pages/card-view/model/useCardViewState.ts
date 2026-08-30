import { type Card, useCard } from "@/entities/card";
import { getCategory, isHighlightLanguage, type Deck, useDeck } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";

const buildCardViewState = (card: Card, deck: Deck, dark: boolean) => {
  const category = getCategory(deck.category, card.tags);

  return {
    text: card.backText,
    category,
    code: isHighlightLanguage(category),
    dark,
  };
};

export const useCardViewState = (cardId: string) => {
  const card = useCard(cardId);
  const deck = useDeck(card?.deckId);
  const preferences = usePreferences();
  if (card == null || deck == null) return;
  return buildCardViewState(card, deck, preferences.appearance.darkMode);
};
