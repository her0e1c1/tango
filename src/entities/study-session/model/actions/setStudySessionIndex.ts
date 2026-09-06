import type { DeckId } from "@/entities/deck/@x/study-session";

import { studySessionStore } from "../store";

// Moves one session to an explicit valid Card index and reports whether it changed.
export const setStudySessionIndex = (deckId: DeckId, currentIndex: number): boolean => {
  let updated = false;
  studySessionStore.setState((state) => {
    const session = state.sessionsByDeckId[deckId];
    // Never persist a resume point that cannot identify an active card.
    if (
      session == null ||
      !Number.isInteger(currentIndex) ||
      currentIndex < 0 ||
      currentIndex >= session.cardOrderIds.length
    ) {
      return;
    }
    session.currentIndex = currentIndex;
    session.lastStudiedAt = Date.now();
    updated = true;
  });
  return updated;
};
