import type { CardId } from "@/entities/card/@x/study-session";
import type { DeckId } from "@/entities/deck/@x/study-session";

import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import type { StudySession, StudySessions } from "./types";

const STUDY_STORAGE_KEY = "tango-study";
const STUDY_STORAGE_VERSION = 3;

interface PersistedStudySessionState {
  sessionsByDeckId: StudySessions;
}

interface StudySessionStoreState extends PersistedStudySessionState {
  start: (deckId: DeckId, cardOrderIds: CardId[]) => void;
  touch: (deckId: DeckId) => void;
  setIndex: (deckId: DeckId, currentIndex: number) => void;
  remove: (deckId: DeckId) => void;
  restoreIfCurrent: (
    deckId: DeckId,
    expectedSession: StudySession | undefined,
    previousSession: StudySession
  ) => boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null && !Array.isArray(value);

const sanitizeStudySession = (value: unknown, fallbackLastStudiedAt?: number): StudySession | undefined => {
  if (!isRecord(value)) return undefined;
  const { deckId, cardOrderIds, currentIndex } = value;
  const lastStudiedAt = value.lastStudiedAt ?? fallbackLastStudiedAt;
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

const sanitizePersistedState = (persistedState: unknown): PersistedStudySessionState => {
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

const migratePersistedState = (persistedState: unknown, version: number): PersistedStudySessionState => {
  if (version !== 1 && version !== 2) return { sessionsByDeckId: {} };
  if (!isRecord(persistedState)) return { sessionsByDeckId: {} };
  const session = sanitizeStudySession(persistedState.session, 0);
  return session == null ? { sessionsByDeckId: {} } : { sessionsByDeckId: { [session.deckId]: session } };
};

const createStudySessionStore = () => {
  const persistStorage = createJSONStorage<PersistedStudySessionState>(() => localStorage);
  return createStore<StudySessionStoreState>()(
    persist<StudySessionStoreState, [], [], PersistedStudySessionState>(
      (set, get) => ({
        sessionsByDeckId: {},
        start: (deckId, cardOrderIds) =>
          set((state) => ({
            sessionsByDeckId: {
              ...state.sessionsByDeckId,
              [deckId]: {
                deckId,
                cardOrderIds: [...cardOrderIds],
                currentIndex: 0,
                lastStudiedAt: Date.now(),
              },
            },
          })),
        touch: (deckId) =>
          set((state) => {
            const session = state.sessionsByDeckId[deckId];
            if (session == null) return state;
            return {
              sessionsByDeckId: {
                ...state.sessionsByDeckId,
                [deckId]: { ...session, lastStudiedAt: Date.now() },
              },
            };
          }),
        setIndex: (deckId, currentIndex) =>
          set((state) => {
            const session = state.sessionsByDeckId[deckId];
            if (
              session == null ||
              !Number.isInteger(currentIndex) ||
              currentIndex < 0 ||
              currentIndex >= session.cardOrderIds.length
            ) {
              return state;
            }
            return {
              sessionsByDeckId: {
                ...state.sessionsByDeckId,
                [deckId]: { ...session, currentIndex, lastStudiedAt: Date.now() },
              },
            };
          }),
        remove: (deckId) =>
          set((state) => {
            const { [deckId]: _removed, ...sessionsByDeckId } = state.sessionsByDeckId;
            return { sessionsByDeckId };
          }),
        restoreIfCurrent: (deckId, expectedSession, previousSession) => {
          // Reference equality makes rollback conditional: a newer session change must always win.
          if (get().sessionsByDeckId[deckId] !== expectedSession) return false;
          set((state) => ({
            sessionsByDeckId: { ...state.sessionsByDeckId, [deckId]: previousSession },
          }));
          return true;
        },
      }),
      {
        name: STUDY_STORAGE_KEY,
        version: STUDY_STORAGE_VERSION,
        storage: persistStorage,
        migrate: migratePersistedState,
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...sanitizePersistedState(persistedState),
        }),
        partialize: ({ sessionsByDeckId }) => ({ sessionsByDeckId }),
      }
    )
  );
};

export const studySessionStore = createStudySessionStore();

export const getStudySession = (deckId: DeckId): StudySession | undefined =>
  studySessionStore.getState().sessionsByDeckId[deckId];

export const startStudySession = (deckId: DeckId, cardOrderIds: CardId[]): void =>
  studySessionStore.getState().start(deckId, cardOrderIds);

export const touchStudySession = (deckId: DeckId): void => studySessionStore.getState().touch(deckId);

export const setStudySessionIndex = (deckId: DeckId, currentIndex: number): void =>
  studySessionStore.getState().setIndex(deckId, currentIndex);

export const removeStudySession = (deckId: DeckId): void => studySessionStore.getState().remove(deckId);

export const restoreStudySession = (
  deckId: DeckId,
  expectedSession: StudySession | undefined,
  previousSession: StudySession
): boolean => studySessionStore.getState().restoreIfCurrent(deckId, expectedSession, previousSession);

export const clearStudySessions = async (): Promise<void> => {
  studySessionStore.setState({ sessionsByDeckId: {} });
  await studySessionStore.persist.clearStorage();
};
