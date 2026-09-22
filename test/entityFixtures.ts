// Test-side setup uses store actions without changing the production persistence boundary.
export { replaceRemoteDecks } from "@/entities/deck/model/actions/replaceRemoteDecks";

export { moveStudySession } from "@/entities/study-session/model/actions/moveStudySession";
export { setStudySessionIndex } from "@/entities/study-session/model/actions/setStudySessionIndex";

import { buildStudyCardOrder } from "@/pages/study-session-start/model/queries/buildStudyCardOrder";
import type { StudySession } from "@/entities/study-session";
import { studySessionStore } from "@/entities/study-session/model/store";

export function restoreStudySession(session: StudySession): void {
  studySessionStore.setState((state) => {
    state.sessionsByDeckId[session.deckId] = session;
  });
}

export function startStudy(
  deckId: string,
  cards: { id: string }[],
  preferences: Parameters<typeof buildStudyCardOrder>[1] & { now?: number },
  uid: string
): void {
  const now = preferences.now ?? Date.now();
  restoreStudySession({
    sessionId: crypto.randomUUID(),
    deckId,
    cardOrderIds: buildStudyCardOrder(
      cards.map((card) => ({ ...card, fsrs: null })),
      preferences,
      now
    ),
    currentIndex: 0,
    lastStudiedAt: now,
    remote: { uid, startedAt: now },
  });
}
