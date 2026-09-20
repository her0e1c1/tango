import { calculateStudySessionIndex, isStudySessionPositionUnchanged } from "../rules";
import { studySessionStore } from "../store";
import type { StudySession } from "../types";
import { queueStudySessionWrite } from "./queueStudySessionWrite";

// Advances only the matching position and removes a session after its final Card.
export function moveStudySession(previous: StudySession): boolean {
  let moved = false;
  studySessionStore.setState((state) => {
    const current = state.sessionsByDeckId[previous.deckId];
    // A persisted swipe may commit after another interaction; only the interaction still owning the card may advance it.
    if (current == null || !isStudySessionPositionUnchanged(previous, current)) return;

    const nextIndex = calculateStudySessionIndex(current);
    if (nextIndex === undefined) {
      queueStudySessionWrite(state.pendingWrites, current, "completed");
      // Persisted state never represents a terminal sentinel index.
      delete state.sessionsByDeckId[previous.deckId];
    } else {
      current.currentIndex = nextIndex;
      current.lastStudiedAt = Date.now();
      queueStudySessionWrite(state.pendingWrites, current);
    }
    moved = true;
  });
  return moved;
}
