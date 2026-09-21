// Test-side setup uses store actions without changing the production persistence boundary.
export { replaceRemoteDecks } from "@/entities/deck/model/actions/replaceRemoteDecks";

export { moveStudySession } from "@/entities/study-session/model/actions/moveStudySession";
export { setStudySessionIndex } from "@/entities/study-session/model/actions/setStudySessionIndex";

import {
  buildStudyCardOrder,
  type CardProgressFields,
  type StudyCardOrderOptions,
} from "@/entities/study-progress/@x/study-session";
import type { StudySession } from "@/entities/study-session";
import { studySessionStore } from "@/entities/study-session/model/store";

export function restoreStudySession(session: StudySession): void {
  studySessionStore.setState((state) => {
    state.sessionsByDeckId[session.deckId] = session;
  });
}

export function startStudy(
  deckId: string,
  cards: CardProgressFields[],
  preferences: StudyCardOrderOptions,
  uid: string
): void {
  const now = Date.now();
  restoreStudySession({
    sessionId: crypto.randomUUID(),
    deckId,
    cardOrderIds: buildStudyCardOrder(cards, preferences),
    currentIndex: 0,
    lastStudiedAt: now,
    remote: { uid, startedAt: now },
  });
}
