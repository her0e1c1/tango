import type { CardId } from "@/entities/card/@x/study-session";
import type { DeckId } from "@/entities/deck/@x/study-session";
import {
  buildStudyCardOrder,
  type CardProgressFields,
  type StudyCardOrderOptions,
} from "@/entities/study-progress/@x/study-session";

import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

import { calculateStudySessionIndex, isStudySessionPositionUnchanged } from "./rules";
import { persistedStudySessionStateSchema, studySessionSchema } from "./schema";
import type { StudySession, StudySessionMovement, StudySessions } from "./types";

const STUDY_STORAGE_KEY = "tango-study";
// No migration is registered: changing this version deliberately invalidates older state shapes.
const STUDY_STORAGE_VERSION = 4;

const createStudySessionId = (): string =>
  crypto.randomUUID?.() ?? crypto.getRandomValues(new Uint32Array(4)).join("-");

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

// Reads the active study session for one Deck outside React.
export const getStudySession = (deckId: DeckId): StudySession | undefined =>
  studySessionStore.getState().sessionsByDeckId[deckId];

// Replaces one Deck's study session with a new identity and owned Card order.
const startStudySession = (deckId: DeckId, cardOrderIds: CardId[]): void => {
  studySessionStore.setState((state) => {
    state.sessionsByDeckId[deckId] = {
      // A fresh identity distinguishes a restarted deck even when it begins on the same card and index.
      sessionId: createStudySessionId(),
      deckId,
      // The store owns this ordering snapshot even if the caller later reuses its array.
      cardOrderIds: [...cardOrderIds],
      currentIndex: 0,
      lastStudiedAt: Date.now(),
    };
  });
};

// Session start owns the state mutation while study-progress owns how the card order is derived.
export const startStudy = (
  deckId: DeckId,
  cards: CardProgressFields[],
  studyPreferences: StudyCardOrderOptions
): void => {
  startStudySession(deckId, buildStudyCardOrder(cards, studyPreferences));
};

// Advances one session's recent-study timestamp without changing its position.
export const touchStudySession = (deckId: DeckId): void => {
  studySessionStore.setState((state) => {
    const session = state.sessionsByDeckId[deckId];
    if (session != null) session.lastStudiedAt = Date.now();
  });
};

// Moves one session to an explicit valid Card index and reports whether it changed.
export const setStudySessionIndex = (deckId: DeckId, currentIndex: number): boolean => {
  let updated = false;
  studySessionStore.setState((state) => {
    const session = state.sessionsByDeckId[deckId];
    // Never persist a resume point that cannot identify an active card.
    if (
      session == null ||
      !Number.isInteger(currentIndex) ||
      currentIndex < 0 ||
      currentIndex >= session.cardOrderIds.length
    ) {
      return;
    }
    session.currentIndex = currentIndex;
    session.lastStudiedAt = Date.now();
    updated = true;
  });
  return updated;
};

// Applies a position-checked movement and removes a session when it crosses either boundary.
export const moveStudySession = (previous: StudySession, movement: StudySessionMovement): boolean => {
  let moved = false;
  studySessionStore.setState((state) => {
    const current = state.sessionsByDeckId[previous.deckId];
    // A persisted swipe may commit after another interaction; only the interaction still owning the card may advance it.
    if (current == null || !isStudySessionPositionUnchanged(previous, current)) return;

    const nextIndex = calculateStudySessionIndex(current, movement);
    if (nextIndex === undefined) {
      // Crossing either boundary removes the session; persisted state never represents a terminal sentinel index.
      delete state.sessionsByDeckId[previous.deckId];
    } else {
      current.currentIndex = nextIndex;
      current.lastStudiedAt = Date.now();
    }
    moved = true;
  });
  return moved;
};

// Removes the active study session owned by one Deck.
export const removeStudySession = (deckId: DeckId): void => {
  studySessionStore.setState((state) => {
    delete state.sessionsByDeckId[deckId];
  });
};

// Clears every live and persisted study session.
export const clearStudySessions = (): void => {
  // Publish the empty state before durable cleanup so auth changes cannot expose the previous user's sessions.
  studySessionStore.setState({ sessionsByDeckId: {} });
  studySessionStore.persist.clearStorage();
};
