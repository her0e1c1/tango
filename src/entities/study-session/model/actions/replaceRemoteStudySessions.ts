import { studySessionStore } from "../store";
import type { StudySession } from "../types";

export function replaceRemoteStudySessions(sessions: StudySession[]): void {
  studySessionStore.setState((state) => {
    state.remoteLoading = false;
    const previous = state.sessionsByDeckId;
    state.sessionsByDeckId = Object.fromEntries(
      Object.entries(previous).filter(([, session]) => session?.remote === undefined)
    );
    for (const session of sessions) {
      if (state.sessionsByDeckId[session.deckId] !== undefined) continue;
      state.sessionsByDeckId[session.deckId] = {
        ...session,
        lastStudiedAt: previous[session.deckId]?.lastStudiedAt ?? 0,
      };
    }
  });
}
