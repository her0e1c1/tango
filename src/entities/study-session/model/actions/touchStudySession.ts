import type { DeckId } from "@/entities/deck/@x/study-session";

import { studySessionStore } from "../store";

// Advances one session's recent-study timestamp without changing its position.
export const touchStudySession = (deckId: DeckId): void => {
  studySessionStore.setState((state) => {
    const session = state.sessionsByDeckId[deckId];
    if (session != null) session.lastStudiedAt = Date.now();
  });
};
