import type { CardId } from "@/entities/card/@x/study-session";
import type { DeckId } from "@/entities/deck/@x/study-session";

import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

import type { StudySession, StudySessions } from "./types";

const STUDY_STORAGE_KEY = "tango-study";
const STUDY_STORAGE_VERSION = 3;

interface StudySessionState {
  sessionsByDeckId: StudySessions;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null && !Array.isArray(value);

const sanitizeStudySession = (value: unknown): StudySession | undefined => {
  if (!isRecord(value)) return undefined;
  const { deckId, cardOrderIds, currentIndex, lastStudiedAt } = value;
  if (
    typeof deckId !== "string" ||
    !Array.isArray(cardOrderIds) ||
    cardOrderIds.length === 0 ||
    !cardOrderIds.every((cardId) => typeof cardId === "string") ||
    typeof currentIndex !== "number" ||
    !Number.isInteger(currentIndex) ||
    currentIndex < 0 ||
    currentIndex >= cardOrderIds.length ||
    typeof lastStudiedAt !== "number" ||
    !Number.isFinite(lastStudiedAt) ||
    lastStudiedAt < 0
  ) {
    return undefined;
  }

  return { deckId, cardOrderIds: [...cardOrderIds], currentIndex, lastStudiedAt };
};

const sanitizePersistedState = (persistedState: unknown): StudySessionState => {
  if (!isRecord(persistedState) || !isRecord(persistedState.sessionsByDeckId)) {
    return { sessionsByDeckId: {} };
  }

  const sessionsByDeckId: StudySessions = {};
  for (const [deckId, value] of Object.entries(persistedState.sessionsByDeckId)) {
    const session = sanitizeStudySession(value);
    if (session?.deckId === deckId) sessionsByDeckId[deckId] = session;
  }
  return { sessionsByDeckId };
};

export const studySessionStore = createStore<StudySessionState>()(
  persist(
    immer(() => ({ sessionsByDeckId: {} })),
    {
      name: STUDY_STORAGE_KEY,
      version: STUDY_STORAGE_VERSION,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...sanitizePersistedState(persistedState),
      }),
    }
  )
);

export const getStudySession = (deckId: DeckId): StudySession | undefined =>
  studySessionStore.getState().sessionsByDeckId[deckId];

export const startStudySession = (deckId: DeckId, cardOrderIds: CardId[]): void => {
  studySessionStore.setState((state) => {
    state.sessionsByDeckId[deckId] = {
      deckId,
      cardOrderIds: [...cardOrderIds],
      currentIndex: 0,
      lastStudiedAt: Date.now(),
    };
  });
};

export const touchStudySession = (deckId: DeckId): void => {
  studySessionStore.setState((state) => {
    const session = state.sessionsByDeckId[deckId];
    if (session != null) session.lastStudiedAt = Date.now();
  });
};

export const setStudySessionIndex = (deckId: DeckId, currentIndex: number): void => {
  studySessionStore.setState((state) => {
    const session = state.sessionsByDeckId[deckId];
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
  });
};

export const removeStudySession = (deckId: DeckId): void => {
  studySessionStore.setState((state) => {
    delete state.sessionsByDeckId[deckId];
  });
};

export const restoreStudySession = (
  deckId: DeckId,
  expectedSession: StudySession | undefined,
  previousSession: StudySession
): boolean => {
  // Reference equality makes rollback conditional: a newer session change must always win.
  if (getStudySession(deckId) !== expectedSession) return false;
  studySessionStore.setState((state) => {
    state.sessionsByDeckId[deckId] = previousSession;
  });
  return true;
};

export const clearStudySessions = async (): Promise<void> => {
  studySessionStore.setState({ sessionsByDeckId: {} });
  await studySessionStore.persist.clearStorage();
};
