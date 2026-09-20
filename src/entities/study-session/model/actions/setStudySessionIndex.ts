import type { DeckId } from "@/entities/deck/@x/study-session";

import { studySessionStore } from "../store";

// Moves one session to an explicit valid Card index and reports whether it changed.
export function setStudySessionIndex(deckId: DeckId, currentIndex: number): boolean {
  let updated = false;
  studySessionStore.setState((state) => {
    const session = state.sessionsByDeckId[deckId];
    // A running session can only advance, including when a slider submits a stale position.
    if (
      session == null ||
      !Number.isInteger(currentIndex) ||
      currentIndex <= session.currentIndex ||
      currentIndex >= session.cardOrderIds.length
    ) {
      return;
    }
    session.currentIndex = currentIndex;
    session.lastStudiedAt = Date.now();
    updated = true;
  });
  return updated;
}
