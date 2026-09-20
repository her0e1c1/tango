import { studySessionStore } from "../store";
import type { StudySessionWrite } from "../types";

// Applying an acknowledged write must not enqueue another write or replace a newer local run.
export function applyStudySessionWrite(write: StudySessionWrite): void {
  studySessionStore.setState((state) => {
    const current = state.sessionsByDeckId[write.session.deckId];
    if (current?.sessionId !== write.session.sessionId) return;
    if (write.endReason !== null) {
      delete state.sessionsByDeckId[write.session.deckId];
    } else if (write.session.currentIndex >= current.currentIndex) {
      state.sessionsByDeckId[write.session.deckId] = {
        ...write.session,
        lastStudiedAt: Math.max(current.lastStudiedAt, write.session.lastStudiedAt),
      };
    }
  });
}
