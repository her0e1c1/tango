import { studySessionStore } from "../store";
import type { StudySession } from "../types";

export function replaceRemoteStudySessions(sessions: StudySession[]): void {
  studySessionStore.setState((state) => {
    state.remoteLoading = false;
    state.sessionsByDeckId = Object.fromEntries(sessions.map((session) => [session.deckId, session]));
  });
}
