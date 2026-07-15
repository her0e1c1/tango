import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

export const STUDY_STORAGE_KEY = "tango-study";

export interface StudySession {
  deckId: DeckId;
  cardOrderIds: CardId[];
  currentIndex: number;
}

interface PersistedStudyState {
  session: StudySession | null;
}

export interface StudyState extends PersistedStudyState {
  showBackText: boolean;
  autoPlay: boolean;
  lastSwipe?: SwipeDirection | undefined;
  startStudy: (deckId: DeckId, cardOrderIds: CardId[]) => void;
  setCurrentIndex: (currentIndex: number) => void;
  resetStudy: () => void;
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null && !Array.isArray(value);

const sanitizePersistedStudyState = (persistedState: unknown): PersistedStudyState => {
  if (!isRecord(persistedState) || !isRecord(persistedState.session)) {
    return { session: null };
  }

  const { deckId, cardOrderIds, currentIndex } = persistedState.session;
  if (
    typeof deckId !== "string" ||
    !Array.isArray(cardOrderIds) ||
    !cardOrderIds.every((cardId) => typeof cardId === "string") ||
    typeof currentIndex !== "number" ||
    !Number.isFinite(currentIndex)
  ) {
    return { session: null };
  }

  return {
    session: {
      deckId,
      cardOrderIds: [...cardOrderIds],
      currentIndex,
    },
  };
};

const migratePersistedStudyState = (persistedState: unknown, version: number): PersistedStudyState =>
  version === 1 ? sanitizePersistedStudyState(persistedState) : { session: null };

export const createStudyStore = ({ storage, skipHydration }: CreateStudyStoreOptions = {}) => {
  const persistStorage = createJSONStorage<PersistedStudyState>(() => storage ?? localStorage);
  return createStore<StudyState>()(
    persist<StudyState, [], [], PersistedStudyState>(
      (set) => ({
        session: null,
        showBackText: false,
        autoPlay: false,
        lastSwipe: undefined,
        startStudy: (deckId, cardOrderIds) =>
          set({
            session: {
              deckId,
              cardOrderIds: [...cardOrderIds],
              currentIndex: 0,
            },
          }),
        setCurrentIndex: (currentIndex) =>
          set((state) => ({
            session: state.session ? { ...state.session, currentIndex } : null,
          })),
        resetStudy: () => set({ session: null }),
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
        version: 2,
        ...(persistStorage !== undefined ? { storage: persistStorage } : {}),
        ...(skipHydration !== undefined ? { skipHydration } : {}),
        migrate: migratePersistedStudyState,
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...sanitizePersistedStudyState(persistedState),
        }),
        partialize: ({ session }) => ({ session }),
      }
    )
  );
};

export const studyStore = createStudyStore();

export const clearStudyStore = async (): Promise<void> => {
  studyStore.setState({
    session: null,
    showBackText: false,
    autoPlay: false,
    lastSwipe: undefined,
  });
  await studyStore.persist.clearStorage();
};

export const selectStudySessionForRoute = (deckId: DeckId) => (state: StudyState) =>
  state.session?.deckId === deckId ? state.session : null;
