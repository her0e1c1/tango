import { calculateStudySessionIndex, isStudySessionPositionUnchanged } from "../rules";
import { studySessionStore } from "../store";
import type { StudySession, StudySessionMovement } from "../types";

// Applies a position-checked movement and removes a session when it crosses either boundary.
export const moveStudySession = (previous: StudySession, movement: StudySessionMovement): boolean => {
  let moved = false;
  studySessionStore.setState((state) => {
    const current = state.sessionsByDeckId[previous.deckId];
    // A persisted swipe may commit after another interaction; only the interaction still owning the card may advance it.
    if (current == null || !isStudySessionPositionUnchanged(previous, current)) return;

    const nextIndex = calculateStudySessionIndex(current, movement);
    if (nextIndex === undefined) {
      // Crossing either boundary removes the session; persisted state never represents a terminal sentinel index.
      delete state.sessionsByDeckId[previous.deckId];
    } else {
      current.currentIndex = nextIndex;
      current.lastStudiedAt = Date.now();
    }
    moved = true;
  });
  return moved;
};
