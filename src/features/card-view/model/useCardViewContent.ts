import { useCard } from "@/entities/card";
import { useDeck } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import { mustExist } from "@/shared/lib/mustExist";

import { buildCardViewContent } from "./buildCardViewContent";

export const useCardViewContent = (cardId: string) => {
  const card = mustExist(useCard(cardId), "Card view rendered outside RouteEntityBoundary");
  const deck = mustExist(useDeck(card.deckId), "Card view requires its parent Deck");
  const preferences = usePreferences();
  return buildCardViewContent(card, deck, preferences.appearance.darkMode);
};
