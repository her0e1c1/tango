import type { DeckId } from "@/entities/deck";

import { studyStore } from "../state/studyStoreInstance";

export const initializeStudySessionUi = (defaultAutoPlay: boolean) => {
  studyStore.getState().initializeStudyUi(defaultAutoPlay);
};

export const removeStudySession = (deckId: DeckId) => {
  studyStore.getState().removeStudy(deckId);
};

export const touchStudySession = (deckId: DeckId) => {
  studyStore.getState().touchStudy(deckId);
};

const discardStudySessionsMissingDecks = (deckIds: Iterable<DeckId>) => {
  const availableDeckIds = new Set(deckIds);
  const state = studyStore.getState();
  for (const deckId of Object.keys(state.sessionsByDeckId)) {
    if (!availableDeckIds.has(deckId)) state.removeStudy(deckId);
  }
};

export const reconcileStudySessionsWithDecks = (deckIds: Iterable<DeckId>): (() => void) | undefined => {
  const currentDeckIds = [...deckIds];
  const reconcile = () => discardStudySessionsMissingDecks(currentDeckIds);
  if (studyStore.persist.hasHydrated()) {
    reconcile();
    return;
  }
  return studyStore.persist.onFinishHydration(reconcile);
};
