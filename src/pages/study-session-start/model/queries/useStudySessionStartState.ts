import { useCardsByDeckId } from "@/entities/card";
import type { Deck } from "@/entities/deck";
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

// Enter belongs to focused interactive controls, even when the Page offers a start shortcut.
export function isInteractiveShortcutTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("a[href], button, input, select, textarea") !== null;
}

export const useStudySessionStartState = (deck: Deck) => {
  const preferences = usePreferences();
  const { cards: deckCards, tags } = useCardsByDeckId(deck.id);

  const cards = selectStudyCards(deckCards, deck, preferences.study.useCardInterval);

  return {
    deckName: deck.name,
    maxNumberOfCardsToLearn: preferences.study.maxNumberOfCardsToLearn,
    cardsLength: cards.length,
    tags,
    cards,
    studyPreferences: preferences.study,
  };
};
