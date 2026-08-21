import { useCard } from "@/entities/card";
import { useDeck } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";

import { buildCardViewContent } from "./buildCardViewContent";

export const useCardViewContent = (cardId: string) => {
  const card = useCard(cardId);
  const deck = useDeck(card?.deckId);
  const preferences = usePreferences();
  if (card == null || deck == null) return;
  return buildCardViewContent(card, deck, preferences.appearance.darkMode);
};
