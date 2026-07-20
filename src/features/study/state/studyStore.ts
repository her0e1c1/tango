/**
 * @file Defines persistent study feature state for Study Store.
 * The store validates saved browser data and exposes the actions that move an active session
 * forward.
 */

import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

export const STUDY_STORAGE_KEY = "tango-study";

export interface StudySession {
  deckId: DeckId;
  cardOrderIds: CardId[];
  currentIndex: number;
  lastStudiedAt: number;
}

interface PersistedStudyState {
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>;
}

export interface StudyState extends PersistedStudyState {
  showBackText: boolean;
  autoPlay: boolean;
  lastSwipe?: SwipeDirection | undefined;
  startStudy: (deckId: DeckId, cardOrderIds: CardId[]) => void;
  touchStudy: (deckId: DeckId) => void;
  setCurrentIndex: (deckId: DeckId, currentIndex: number) => void;
  removeStudy: (deckId: DeckId) => void;
  initializeStudyUi: (defaultAutoPlay: boolean) => void;
  toggleShowBackText: () => void;
  toggleAutoPlay: () => void;
  setLastSwipe: (lastSwipe: SwipeDirection) => void;
  hideBackText: () => void;
}

interface CreateStudyStoreOptions {
  storage?: StateStorage;
  skipHydration?: boolean;
}

/**
 * Checks whether an unknown value is a non-null object rather than an array.
 * Persisted-state validation uses this guard before reading named properties safely.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null && !Array.isArray(value);

/**
 * Validates unknown persisted data before treating it as a study session.
 * Invalid identifiers, card orders, indexes, or timestamps are rejected instead of entering the
 * live store.
 */
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

  return {
    deckId,
    cardOrderIds: [...cardOrderIds],
    currentIndex,
    lastStudiedAt,
  };
};

/**
 * Builds safe study state from unknown browser storage data.
 * Only sessions that pass validation and match their storage key are retained.
 */
const sanitizePersistedStudyState = (persistedState: unknown): PersistedStudyState => {
  if (!isRecord(persistedState) || !isRecord(persistedState.sessionsByDeckId)) {
    return { sessionsByDeckId: {} };
  }

  const sessionsByDeckId: Partial<Record<DeckId, StudySession>> = {};
  for (const [deckId, value] of Object.entries(persistedState.sessionsByDeckId)) {
    const session = sanitizeStudySession(value);
    if (session?.deckId === deckId) sessionsByDeckId[deckId] = session;
  }
  return { sessionsByDeckId };
};

/**
 * Converts supported older study-state formats into the current per-deck format.
 * Unknown versions are discarded so incompatible saved data cannot corrupt a study session.
 */
const migratePersistedStudyState = (persistedState: unknown, version: number): PersistedStudyState => {
  if (version !== 1 && version !== 2) return { sessionsByDeckId: {} };
  if (!isRecord(persistedState)) return { sessionsByDeckId: {} };
  const session = sanitizeStudySession(persistedState.session, 0);
  return session == null ? { sessionsByDeckId: {} } : { sessionsByDeckId: { [session.deckId]: session } };
};

/**
 * Creates and configures a study store.
 * Optional dependencies or settings let production code and tests reuse the same behavior in
 * different environments.
 */
export const createStudyStore = ({ storage, skipHydration }: CreateStudyStoreOptions = {}) => {
  const persistStorage = createJSONStorage<PersistedStudyState>(() => storage ?? localStorage);
  return createStore<StudyState>()(
    persist<StudyState, [], [], PersistedStudyState>(
      (set) => ({
        sessionsByDeckId: {},
        showBackText: false,
        autoPlay: false,
        lastSwipe: undefined,
        startStudy: (deckId, cardOrderIds) =>
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
        touchStudy: (deckId) =>
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
        setCurrentIndex: (deckId, currentIndex) =>
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
        removeStudy: (deckId) =>
          set((state) => {
            const { [deckId]: _removed, ...sessionsByDeckId } = state.sessionsByDeckId;
            return { sessionsByDeckId };
          }),
        initializeStudyUi: (defaultAutoPlay) =>
          set({
            showBackText: false,
            autoPlay: defaultAutoPlay,
            lastSwipe: undefined,
          }),
        toggleShowBackText: () => set((state) => ({ showBackText: !state.showBackText })),
        toggleAutoPlay: () => set((state) => ({ autoPlay: !state.autoPlay })),
        setLastSwipe: (lastSwipe) => set({ lastSwipe }),
        hideBackText: () => set({ showBackText: false }),
      }),
      {
        name: STUDY_STORAGE_KEY,
        version: 3,
        ...(persistStorage !== undefined ? { storage: persistStorage } : {}),
        ...(skipHydration !== undefined ? { skipHydration } : {}),
        migrate: migratePersistedStudyState,
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...sanitizePersistedStudyState(persistedState),
        }),
        partialize: ({ sessionsByDeckId }) => ({ sessionsByDeckId }),
      }
    )
  );
};

export const studyStore = createStudyStore();

/**
 * Clears every study session, resets transient study controls, and removes persisted browser data.
 * Logout awaits this function so a previous user's study progress cannot reappear after hydration.
 */
export const clearStudyStore = async (): Promise<void> => {
  studyStore.setState({
    sessionsByDeckId: {},
    showBackText: false,
    autoPlay: false,
    lastSwipe: undefined,
  });
  await studyStore.persist.clearStorage();
};

/**
 * Selects study session for route from a larger state value.
 * Callers can subscribe to this focused result without learning how the full store is organized.
 */
export const selectStudySessionForRoute = (deckId: DeckId) => (state: StudyState) =>
  state.sessionsByDeckId[deckId] ?? null;
