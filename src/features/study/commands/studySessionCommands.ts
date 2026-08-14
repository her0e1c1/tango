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
