import type { DeckId } from "@/entities/deck/@x/study-session";
import { useStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

import type { StudySession, StudySessions } from "./types";

interface StudySessionState {
  sessionsByDeckId: StudySessions;
  remoteLoading: boolean;
}

export const studySessionStore = createStore<StudySessionState>()(
  immer(() => ({ sessionsByDeckId: {}, remoteLoading: false }))
);

export const getStudySession = (deckId: DeckId): StudySession | undefined =>
  studySessionStore.getState().sessionsByDeckId[deckId];

/** Keeps single-deck consumers isolated from updates to unrelated sessions. */
export const useStudySession = (deckId: DeckId): StudySession | undefined =>
  useStore(studySessionStore, (state) => state.sessionsByDeckId[deckId]);

/** Exposes the full map to consumers that compare or order progress across decks. */
export const useStudySessions = (): StudySessions => useStore(studySessionStore, (state) => state.sessionsByDeckId);

export function useRemoteStudySessionsLoading(): boolean {
  return useStore(studySessionStore, (state) => state.remoteLoading);
}

export const clearStudySessions = (): void => {
  studySessionStore.setState({ sessionsByDeckId: {}, remoteLoading: false });
};

export function setStudySessionOwner(uid: string | undefined): void {
  studySessionStore.setState((state) => {
    state.remoteLoading = uid !== undefined;
    for (const [deckId, session] of Object.entries(state.sessionsByDeckId)) {
      if (session && session.remote.uid !== uid) delete state.sessionsByDeckId[deckId];
    }
  });
}

export function finishStudySessionLoading(): void {
  studySessionStore.setState({ remoteLoading: false });
}

export function replaceRemoteStudySessions(sessions: StudySession[]): void {
  studySessionStore.setState((state) => {
    state.remoteLoading = false;
    state.sessionsByDeckId = Object.fromEntries(sessions.map((session) => [session.deckId, session]));
  });
}
