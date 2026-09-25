import type { DeckId } from "@/entities/deck/@x/study-session";
import { createStore } from "zustand/vanilla";

import type { StudySession, StudySessions } from "./types";

interface StudySessionState {
  sessionsByDeckId: StudySessions;
  remoteLoading: boolean;
}

export const studySessionStore = createStore<StudySessionState>()(() => ({
  sessionsByDeckId: {},
  remoteLoading: false,
}));

export const getStudySession = (deckId: DeckId): StudySession | undefined =>
  studySessionStore.getState().sessionsByDeckId[deckId];

export function clearStudySessions(): void {
  studySessionStore.setState({ sessionsByDeckId: {}, remoteLoading: false });
}

export function setStudySessionOwner(uid: string | undefined): void {
  studySessionStore.setState((state) => ({
    remoteLoading: uid !== undefined,
    sessionsByDeckId: Object.fromEntries(
      Object.entries(state.sessionsByDeckId).filter(([, session]) => session?.remote.uid === uid)
    ),
  }));
}

export function finishStudySessionLoading(): void {
  studySessionStore.setState({ remoteLoading: false });
}

export function replaceRemoteStudySessions(sessions: StudySession[]): void {
  studySessionStore.setState({
    remoteLoading: false,
    sessionsByDeckId: Object.fromEntries(sessions.map((session) => [session.deckId, session])),
  });
}
