import { useCard } from "@/entities/card";
import { useDeck } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";

import { buildCardViewContent } from "./buildCardViewContent";

export const useCardViewState = (cardId: string) => {
  const card = useCard(cardId);
  const deck = useDeck(card?.deckId);
  const preferences = usePreferences();

  return {
    available: card != null && deck != null,
    content:
      card == null || deck == null ? undefined : buildCardViewContent(card, deck, preferences.appearance.darkMode),
  };
};
