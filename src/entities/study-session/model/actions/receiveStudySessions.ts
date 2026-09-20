import { studySessionStore } from "../store";
import type { StudySessionWrite } from "../types";
import { compareStudySessionCreation } from "../rules";

export function receiveStudySessions(writes: StudySessionWrite[]): void {
  studySessionStore.setState((state) => {
    const latestByDeck = new Map<string, StudySessionWrite>();
    for (const write of writes) {
      const previous = latestByDeck.get(write.session.deckId);
      if (previous === undefined || compareStudySessionCreation(write.session, previous.session) > 0) {
        latestByDeck.set(write.session.deckId, write);
      }
    }
    for (const [deckId, { session, endReason }] of latestByDeck) {
      const current = state.sessionsByDeckId[deckId];
      if (endReason !== null) {
        delete state.sessionsByDeckId[deckId];
      } else {
        state.sessionsByDeckId[deckId] = {
          ...session,
          lastStudiedAt: current?.lastStudiedAt ?? 0,
        };
      }
    }
  });
}
