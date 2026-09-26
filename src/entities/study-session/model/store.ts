import { compareStudySessionCreation } from "./rules";
import { createStore } from "zustand/vanilla";

import type { StudySessions, StudySessionSnapshot } from "./types";

interface StudySessionState {
  sessionsByDeckId: StudySessions;
  remoteLoading: boolean;
  ownerUid: string | undefined;
  history: StudySessionSnapshot[];
  fromCache: boolean;
  syncError: Error | null;
}

export const studySessionStore = createStore<StudySessionState>(() => ({
  sessionsByDeckId: {},
  remoteLoading: false,
  ownerUid: undefined,
  history: [],
  fromCache: true,
  syncError: null,
}));

export function clearStudySessions(): void {
  studySessionStore.setState({
    sessionsByDeckId: {},
    remoteLoading: false,
    ownerUid: undefined,
    history: [],
    fromCache: true,
    syncError: null,
  });
}

export function setStudySessionOwner(uid: string | undefined): void {
  studySessionStore.setState((state) => ({
    remoteLoading: uid !== undefined,
    ownerUid: uid,
    history: state.ownerUid === uid ? state.history : [],
    fromCache: true,
    syncError: null,
    sessionsByDeckId: Object.fromEntries(
      Object.entries(state.sessionsByDeckId).filter(([, session]) => session?.remote.uid === uid)
    ),
  }));
}

export function setStudySessionSyncError(syncError: Error): void {
  studySessionStore.setState({ remoteLoading: false, syncError });
}

export function applyStudySessionSnapshot(
  uid: string,
  result: { values: (StudySessionSnapshot | null)[]; fromCache: boolean }
) {
  if (studySessionStore.getState().ownerUid !== uid) return;
  const history = result.values.filter((value) => value !== null);
  const latest = new Map<string, StudySessionSnapshot>();
  for (const record of history) {
    const previous = latest.get(record.session.deckId);
    if (!previous || compareStudySessionCreation(record.session, previous.session) > 0)
      latest.set(record.session.deckId, record);
  }
  studySessionStore.setState({
    history,
    sessionsByDeckId: Object.fromEntries(
      [...latest.values()].filter(({ endReason }) => endReason === null).map(({ session }) => [session.deckId, session])
    ),
    remoteLoading: false,
    fromCache: result.fromCache,
    syncError: null,
  });
}
