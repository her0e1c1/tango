import { studySessionStore } from "../store";
import type { StudySessionWrite } from "../types";
import { compareStudySessionCreation } from "../rules";

export function receiveStudySessions(uid: string, writes: StudySessionWrite[]): void {
  studySessionStore.setState((state) => {
    const latestByDeck = new Map<string, StudySessionWrite>();
    for (const write of writes) {
      if (write.session.remote?.uid !== uid) continue;
      const previous = latestByDeck.get(write.session.deckId);
      if (previous === undefined || compareStudySessionCreation(write.session, previous.session) > 0) {
        latestByDeck.set(write.session.deckId, write);
      }
    }
    for (const [deckId, { session, endReason }] of latestByDeck) {
      const current = state.sessionsByDeckId[deckId];
      // A local-only run is never replaced by a cloud session for the same Deck id.
      if (current !== undefined && current.remote === undefined) continue;
      const confirmedCurrent =
        writes.find((write) => write.session.sessionId === current?.sessionId)?.session ?? current;
      if (
        confirmedCurrent?.remote !== undefined &&
        confirmedCurrent.sessionId !== session.sessionId &&
        (confirmedCurrent.remote.createdAt === undefined || compareStudySessionCreation(confirmedCurrent, session) > 0)
      )
        continue;
      if (endReason !== null) {
        delete state.sessionsByDeckId[deckId];
      } else {
        state.sessionsByDeckId[deckId] = {
          ...session,
          lastStudiedAt: current?.lastStudiedAt ?? 0,
          currentIndex:
            current?.sessionId === session.sessionId
              ? Math.max(current.currentIndex, session.currentIndex)
              : session.currentIndex,
        };
      }
    }
  });
}
