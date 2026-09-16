import { type Card, type CardId, useCardsByDeckId } from "@/entities/card";
import { type Deck, getCategory, isHighlightLanguage } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { MAX_DIFFICULTY, MIN_DIFFICULTY } from "@/entities/study-progress";
import { selectStudyCards } from "@/entities/study-session";

export const useCardListQuery = (deck: Deck, shownCard: Card | undefined, deletionTarget: CardId | undefined) => {
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deck.id);
  const deletionTargetName = deckCards.find((card) => card.id === deletionTarget)?.frontText;
  const cards = selectStudyCards(deckCards, deck, preferences.study.useCardInterval);
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
    deletionTargetName,
    bulkDifficultyMaximum: MAX_DIFFICULTY,
    bulkDifficultyMinimum: MIN_DIFFICULTY,
  };
};
