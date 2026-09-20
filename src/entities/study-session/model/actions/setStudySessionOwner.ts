import { studySessionStore } from "../store";

export function setStudySessionOwner(uid: string | undefined): void {
  studySessionStore.setState((state) => {
    for (const [deckId, session] of Object.entries(state.sessionsByDeckId)) {
      if (session?.remote !== undefined && session.remote.uid !== uid) delete state.sessionsByDeckId[deckId];
    }
    for (const [id, write] of Object.entries(state.pendingWrites)) {
      if (write.session.remote?.uid !== uid) delete state.pendingWrites[id];
    }
    state.syncStatus = uid !== undefined ? "loading" : "idle";
  });
}
