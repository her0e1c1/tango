import { studySessionStore } from "../store";

export function setStudySessionOwner(uid: string | undefined): void {
  studySessionStore.setState((state) => {
    for (const [deckId, session] of Object.entries(state.sessionsByDeckId)) {
      if (session?.remote !== undefined && session.remote.uid !== uid) delete state.sessionsByDeckId[deckId];
    }
    state.syncUid = uid;
    state.syncStatus = uid !== undefined ? "loading" : "idle";
  });
}
