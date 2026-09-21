import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";
import type { StudySessions } from "./types";

interface StudySessionState {
  sessionsByDeckId: StudySessions;
  remoteLoading: boolean;
}

export const studySessionStore = createStore<StudySessionState>()(
  immer(() => ({ sessionsByDeckId: {}, remoteLoading: false }))
);
