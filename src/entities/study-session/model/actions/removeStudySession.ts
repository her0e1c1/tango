import type { DeckId } from "@/entities/deck/@x/study-session";

import { studySessionStore } from "../store";

// Removes the active study session owned by one Deck.
export const removeStudySession = (deckId: DeckId): void => {
  studySessionStore.setState((state) => {
    delete state.sessionsByDeckId[deckId];
  });
};
