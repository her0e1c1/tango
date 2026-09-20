import { studySessionStore } from "../store";
import type { StudySession } from "../types";

export function restoreStudySession(session: StudySession): void {
  studySessionStore.setState((state) => {
    state.sessionsByDeckId[session.deckId] = session;
  });
}
