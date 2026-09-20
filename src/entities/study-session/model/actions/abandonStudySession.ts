import { studySessionStore } from "../store";
import { queueStudySessionWrite } from "./queueStudySessionWrite";

export function abandonStudySession(deckId: string): void {
  studySessionStore.setState((state) => {
    const session = state.sessionsByDeckId[deckId];
    if (session === undefined) return;
    queueStudySessionWrite(state.pendingWrites, session, "abandoned");
    delete state.sessionsByDeckId[deckId];
  });
}
