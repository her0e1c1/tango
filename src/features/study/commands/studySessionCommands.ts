import type { DeckId } from "@/entities/deck";

import { studyStore } from "../state/studyStore";

export const removeStudySession = (deckId: DeckId) => {
  studyStore.getState().removeStudy(deckId);
};

export const touchStudySession = (deckId: DeckId) => {
  studyStore.getState().touchStudy(deckId);
};

export const discardStudySessionsMissingDecks = (deckIds: Iterable<DeckId>) => {
  const availableDeckIds = new Set(deckIds);
  const state = studyStore.getState();
  for (const deckId of Object.keys(state.sessionsByDeckId)) {
    if (!availableDeckIds.has(deckId)) state.removeStudy(deckId);
  }
};
