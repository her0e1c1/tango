import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

import { persistedStudySessionStateSchema, studySessionSchema, studySessionWriteSchema } from "./schema";
import type { StudySessions, StudySessionSyncStatus, StudySessionWrites } from "./types";

const STUDY_STORAGE_KEY = "tango-study";
// No migration is registered: changing this version deliberately invalidates older state shapes.
const STUDY_STORAGE_VERSION = 4;

/** Persisted study sessions indexed by their owning Deck. */
interface StudySessionState {
  sessionsByDeckId: StudySessions;
  pendingWrites: StudySessionWrites;
  syncStatus: StudySessionSyncStatus;
}

// Restores only independently valid sessions whose Deck key matches their payload.
const sanitizePersistedState = (
  persistedState: unknown
): Pick<StudySessionState, "sessionsByDeckId" | "pendingWrites"> => {
  const parsedState = persistedStudySessionStateSchema.safeParse(persistedState);
  if (!parsedState.success) return { sessionsByDeckId: {}, pendingWrites: {} };

  const sessionsByDeckId: StudySessions = {};
  for (const [deckId, value] of Object.entries(parsedState.data.sessionsByDeckId)) {
    const parsedSession = studySessionSchema.safeParse(value);
    if (parsedSession.success && parsedSession.data.deckId === deckId) {
      sessionsByDeckId[deckId] = parsedSession.data;
    }
  }
  const pendingWrites: StudySessionWrites = {};
  for (const [id, value] of Object.entries(parsedState.data.pendingWrites)) {
    const parsed = studySessionWriteSchema.safeParse(value);
    if (parsed.success && parsed.data.session.sessionId === id && parsed.data.session.remote !== undefined) {
      pendingWrites[id] = parsed.data;
    }
  }
  return { sessionsByDeckId, pendingWrites };
};

export const studySessionStore = createStore<StudySessionState>()(
  persist(
    immer(() => ({ sessionsByDeckId: {}, pendingWrites: {}, syncStatus: "idle" })),
    {
      name: STUDY_STORAGE_KEY,
      version: STUDY_STORAGE_VERSION,
      partialize: ({ sessionsByDeckId, pendingWrites }) => ({ sessionsByDeckId, pendingWrites }),
      // Only sanitized fields enter live state; incompatible shapes and unknown metadata are intentionally discarded.
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizePersistedState(persistedState),
      }),
    }
  )
);
