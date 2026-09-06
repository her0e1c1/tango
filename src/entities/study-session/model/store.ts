import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

import { persistedStudySessionStateSchema, studySessionSchema } from "./schema";
import type { StudySessions } from "./types";

const STUDY_STORAGE_KEY = "tango-study";
// No migration is registered: changing this version deliberately invalidates older state shapes.
const STUDY_STORAGE_VERSION = 4;

/** Persisted study sessions indexed by their owning Deck. */
interface StudySessionState {
  sessionsByDeckId: StudySessions;
}

// Restores only independently valid sessions whose Deck key matches their payload.
const sanitizePersistedState = (persistedState: unknown): StudySessionState => {
  const parsedState = persistedStudySessionStateSchema.safeParse(persistedState);
  if (!parsedState.success) return { sessionsByDeckId: {} };

  const sessionsByDeckId: StudySessions = {};
  for (const [deckId, value] of Object.entries(parsedState.data.sessionsByDeckId)) {
    const parsedSession = studySessionSchema.safeParse(value);
    if (parsedSession.success && parsedSession.data.deckId === deckId) {
      sessionsByDeckId[deckId] = parsedSession.data;
    }
  }
  return { sessionsByDeckId };
};

export const studySessionStore = createStore<StudySessionState>()(
  persist(
    immer(() => ({ sessionsByDeckId: {} })),
    {
      name: STUDY_STORAGE_KEY,
      version: STUDY_STORAGE_VERSION,
      // Only sanitized fields enter live state; incompatible shapes and unknown metadata are intentionally discarded.
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizePersistedState(persistedState),
      }),
    }
  )
);
