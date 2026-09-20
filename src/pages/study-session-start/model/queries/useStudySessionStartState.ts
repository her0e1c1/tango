import { useCardsByDeckId } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { DeckFilterValues } from "@/features/deck-filter";
import { usePreferences } from "@/entities/preference";
import { selectStudyCards, type getStudySessionSyncStatus } from "@/entities/study-session";

export function getStudyStartAvailability(
  localMode: boolean,
  isAnonymous: boolean,
  syncStatus: ReturnType<typeof getStudySessionSyncStatus>,
  saving: boolean
) {
  const remote = !localMode && !isAnonymous;
  return { disabled: saving || (remote && syncStatus !== "ready"), syncError: remote && syncStatus === "error" };
}

export const useStudySessionStartState = (deckId: DeckId, filter: DeckFilterValues) => {
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deckId);

  const cards = selectStudyCards(deckCards, filter, preferences.study.useCardInterval);

  return {
    maxNumberOfCardsToLearn: preferences.study.maxNumberOfCardsToLearn,
    cardsLength: cards.length,
    tags,
    cards,
    studyPreferences: preferences.study,
  };
};
