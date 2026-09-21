import { studySessionStore } from "../store";

export function setStudySessionOwner(uid: string | undefined): void {
  studySessionStore.setState((state) => {
    state.remoteLoading = uid !== undefined;
    for (const [deckId, session] of Object.entries(state.sessionsByDeckId)) {
      if (session && session.remote.uid !== uid) delete state.sessionsByDeckId[deckId];
    }
  });
}
