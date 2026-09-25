import { compareStudySessionCreation } from "./rules";
import type { DeckId } from "@/entities/deck/@x/study-session";
import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { syncPersistence, type SyncState, type SyncedQueryResult } from "@/shared/api";

import type { StudySession, StudySessions, StudySessionSnapshot } from "./types";

interface StudySessionState extends SyncState {
  sessionsByDeckId: StudySessions;
  remoteLoading: boolean;
  ownerUid: string | undefined;
  history: StudySessionSnapshot[];
  fromCache: boolean;
  syncError: Error | null;
}

export const studySessionStore = createStore<StudySessionState>()(
  persist(
    (): StudySessionState => ({
      sessionsByDeckId: {},
      remoteLoading: false,
      ownerUid: undefined,
      history: [],
      fromCache: true,
      syncError: null,
      sync: {},
    }),
    syncPersistence("tango-study-session-sync")
  )
);

export const getStudySession = (deckId: DeckId): StudySession | undefined =>
  studySessionStore.getState().sessionsByDeckId[deckId];

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
  scope: string,
  result: SyncedQueryResult<StudySessionSnapshot | null>
) {
  if (studySessionStore.getState().ownerUid !== uid) return;
  const history = result.values.filter((value) => value !== null);
  const latest = new Map<string, StudySessionSnapshot>();
  for (const record of history) {
    const previous = latest.get(record.session.deckId);
    if (!previous || compareStudySessionCreation(record.session, previous.session) > 0)
      latest.set(record.session.deckId, record);
  }
  const sync = { ...studySessionStore.getState().sync };
  if (result.checkpoint === null) delete sync[scope];
  else if (result.checkpoint) sync[scope] = result.checkpoint;
  return studySessionStore.setState({
    history,
    sessionsByDeckId: Object.fromEntries(
      [...latest.values()].filter(({ endReason }) => endReason === null).map(({ session }) => [session.deckId, session])
    ),
    remoteLoading: false,
    fromCache: result.fromCache,
    syncError: null,
    ...(result.checkpoint !== undefined ? { sync } : {}),
  });
}
