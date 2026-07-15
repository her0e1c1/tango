import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

export const STUDY_STORAGE_KEY = "tango-study";

export interface StudySession {
  deckId: DeckId;
  cardOrderIds: CardId[];
  currentIndex: number;
}

export interface LegacyStudyFields {
  cardOrderIds: CardId[];
  currentIndex: number | null;
}

export interface LegacyStudyCandidate extends LegacyStudyFields {
  id: DeckId;
}

interface PersistedStudyState {
  session: StudySession | null;
  legacyMigratedDeckIds: Record<DeckId, true>;
}

export interface StudyState extends PersistedStudyState {
  showBackText: boolean;
  autoPlay: boolean;
  lastSwipe?: SwipeDirection | undefined;
  startStudy: (deckId: DeckId, cardOrderIds: CardId[]) => void;
  setCurrentIndex: (currentIndex: number) => void;
  resetStudy: () => void;
  markLegacyMigrated: (deckId: DeckId) => void;
  importLegacyStudy: (routeDeckId: DeckId, candidate?: LegacyStudyCandidate) => boolean;
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

export const createStudyStore = ({ storage, skipHydration }: CreateStudyStoreOptions = {}) => {
  const persistStorage = createJSONStorage<PersistedStudyState>(() => storage ?? localStorage);
  return createStore<StudyState>()(
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
        importLegacyStudy: (routeDeckId, candidate) => {
          let imported = false;
          set((state) => {
            if (
              state.session != null ||
              candidate == null ||
              candidate.id !== routeDeckId ||
              candidate.cardOrderIds.length === 0 ||
              typeof candidate.currentIndex !== "number" ||
              state.legacyMigratedDeckIds[routeDeckId]
            ) {
              return state;
            }

            imported = true;
            return {
              session: {
                deckId: routeDeckId,
                cardOrderIds: [...candidate.cardOrderIds],
                currentIndex: candidate.currentIndex,
              },
              legacyMigratedDeckIds: {
                ...state.legacyMigratedDeckIds,
                [routeDeckId]: true,
              },
            };
          });
          return imported;
        },
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
        ...(persistStorage !== undefined ? { storage: persistStorage } : {}),
        ...(skipHydration !== undefined ? { skipHydration } : {}),
        partialize: ({ session, legacyMigratedDeckIds }) => ({
          session,
          legacyMigratedDeckIds,
        }),
      }
    )
  );
};

export const studyStore = createStudyStore();

export const clearStudyStore = async (): Promise<void> => {
  studyStore.setState({
    session: null,
    legacyMigratedDeckIds: {},
    showBackText: false,
    autoPlay: false,
    lastSwipe: undefined,
  });
  await studyStore.persist.clearStorage();
};

export const selectStudySessionForRoute = (deckId: DeckId) => (state: StudyState) =>
  state.session?.deckId === deckId ? state.session : null;
