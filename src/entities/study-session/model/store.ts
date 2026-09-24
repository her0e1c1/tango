import type { DeckId } from "@/entities/deck/@x/study-session";
import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { syncPersistence, type SyncState } from "@/shared/api";

import type { StudySession, StudySessions, StudySessionSnapshot } from "./types";

interface StudySessionState extends SyncState {
  sessionsByDeckId: StudySessions;
  remoteLoading: boolean;
  ownerUid: string | undefined;
  history: StudySessionSnapshot[];
  fromCache: boolean;
}

export const studySessionStore = createStore<StudySessionState>()(
  persist(
    (): StudySessionState => ({
      sessionsByDeckId: {},
      remoteLoading: false,
      ownerUid: undefined,
      history: [],
      fromCache: true,
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
  });
}

export function setStudySessionOwner(uid: string | undefined): void {
  studySessionStore.setState((state) => ({
    remoteLoading: uid !== undefined,
    ownerUid: uid,
    history: state.ownerUid === uid ? state.history : [],
    fromCache: true,
    sessionsByDeckId: Object.fromEntries(
      Object.entries(state.sessionsByDeckId).filter(([, session]) => session?.remote.uid === uid)
    ),
  }));
}

export function finishStudySessionLoading(): void {
  studySessionStore.setState({ remoteLoading: false });
}
