import type { Card } from "@/entities/card";
import { getCategory, isHighlightLanguage, type Deck } from "@/entities/deck";

export interface CardViewContent {
  text: string;
  category: string;
  code: boolean;
  dark: boolean;
}

export const buildCardViewContent = (card: Card, deck: Deck, dark: boolean): CardViewContent => {
  const category = getCategory(deck.category, card.tags);

  return {
    text: card.backText,
    category,
    code: isHighlightLanguage(category),
    dark,
  };
};
