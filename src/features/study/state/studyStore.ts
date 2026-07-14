import { useStore } from "zustand";
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
  legacyMigratedDeckIds: Record<DeckId, true>;
}

export interface StudyState extends PersistedStudyState {
  showBackText: boolean;
  autoPlay: boolean;
  lastSwipe?: SwipeDirection;
  startStudy: (deckId: DeckId, cardOrderIds: CardId[]) => void;
  setCurrentIndex: (currentIndex: number) => void;
  resetStudy: () => void;
  markLegacyMigrated: (deckId: DeckId) => void;
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

export const createStudyStore = ({ storage, skipHydration }: CreateStudyStoreOptions = {}) =>
  createStore<StudyState>()(
    persist<StudyState, [], [], PersistedStudyState>(
      (set) => ({
        session: null,
        legacyMigratedDeckIds: {},
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
        markLegacyMigrated: (deckId) =>
          set((state) => ({
            legacyMigratedDeckIds: {
              ...state.legacyMigratedDeckIds,
              [deckId]: true,
            },
          })),
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
        version: 1,
        storage: createJSONStorage<PersistedStudyState>(() => storage ?? localStorage),
        skipHydration,
        partialize: ({ session, legacyMigratedDeckIds }) => ({
          session,
          legacyMigratedDeckIds,
        }),
      },
    ),
  );

export const studyStore = createStudyStore();

export const useStudyStore = <T>(selector: (state: StudyState) => T): T =>
  useStore(studyStore, selector);

export const selectStudySessionForRoute = (deckId: DeckId) => (state: StudyState) =>
  state.session?.deckId === deckId ? state.session : null;
