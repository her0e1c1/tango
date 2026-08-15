import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { z } from "zod";

import { persistedStudyProgressSchema, studyProgressEditSchema, studyProgressSchema } from "./schema";
import type { StudyProgress, StudyProgressEdit } from "./types";

interface StudyProgressState {
  remoteProgresses: StudyProgress[];
  localProgresses: StudyProgress[];
}

interface PersistedStudyProgressState {
  localProgresses: StudyProgress[];
}

interface CreateStudyProgressStoreOptions {
  storage?: StateStorage;
  skipHydration?: boolean;
}

const LOCAL_STUDY_PROGRESS_STORAGE_KEY = "tango-local-study-progresses";
const LEGACY_LOCAL_CARD_STORAGE_KEY = "tango-local-cards";

const persistedStudyProgressStateSchema = z.object({
  localProgresses: z.array(persistedStudyProgressSchema),
});

const legacyLocalCardProgressSchema = persistedStudyProgressSchema.omit({ cardId: true }).extend({
  id: studyProgressSchema.shape.cardId,
});
const legacyLocalCardStorageSchema = z.object({
  state: z.object({ localCards: z.array(z.unknown()) }),
  version: z.literal(1),
});

const parsePersistedStudyProgressState = (value: unknown): PersistedStudyProgressState => {
  const result = persistedStudyProgressStateSchema.safeParse(value);
  return result.success ? result.data : { localProgresses: [] };
};

const parseLegacyLocalCardProgresses = (value: string | null): StudyProgress[] | null => {
  if (value === null) return null;
  try {
    const legacyStore = legacyLocalCardStorageSchema.safeParse(JSON.parse(value));
    if (!legacyStore.success) return null;
    return legacyStore.data.state.localCards.flatMap((card) => {
      const result = legacyLocalCardProgressSchema.safeParse(card);
      if (!result.success) return [];
      const { id: cardId, ...progress } = result.data;
      return [{ cardId, ...progress }];
    });
  } catch {
    return null;
  }
};

const migrateLegacyLocalCardProgresses = (storage: Storage): void => {
  if (storage.getItem(LOCAL_STUDY_PROGRESS_STORAGE_KEY) !== null) return;
  const localProgresses = parseLegacyLocalCardProgresses(storage.getItem(LEGACY_LOCAL_CARD_STORAGE_KEY));
  if (localProgresses === null) return;
  // Creating the dedicated key is the migration marker, so compatibility never enters the normal runtime path.
  storage.setItem(LOCAL_STUDY_PROGRESS_STORAGE_KEY, JSON.stringify({ state: { localProgresses }, version: 1 }));
};

const createStudyProgressStore = ({ storage, skipHydration }: CreateStudyProgressStoreOptions = {}) => {
  if (storage === undefined) migrateLegacyLocalCardProgresses(localStorage);
  const persistStorage = createJSONStorage<PersistedStudyProgressState>(() => storage ?? localStorage);
  return createStore<StudyProgressState>()(
    persist<StudyProgressState, [], [], PersistedStudyProgressState>(
      () => ({ remoteProgresses: [], localProgresses: [] }),
      {
        name: LOCAL_STUDY_PROGRESS_STORAGE_KEY,
        version: 1,
        ...(persistStorage !== undefined ? { storage: persistStorage } : {}),
        ...(skipHydration !== undefined ? { skipHydration } : {}),
        merge: (persistedState, currentState) => ({
          ...currentState,
          ...parsePersistedStudyProgressState(persistedState),
        }),
        partialize: ({ localProgresses }) => ({ localProgresses }),
      }
    )
  );
};

const studyProgressStore = createStudyProgressStore();

export const createLocalStudyProgress = (input: StudyProgress): StudyProgress => {
  const progress = studyProgressSchema.parse(input);
  const localProgresses = studyProgressStore
    .getState()
    .localProgresses.filter((item) => item.cardId !== progress.cardId);
  studyProgressStore.setState({ localProgresses: [...localProgresses, progress] });
  return progress;
};

export const editLocalStudyProgress = (input: StudyProgressEdit): StudyProgress => {
  const edit = studyProgressEditSchema.parse(input);
  const { localProgresses } = studyProgressStore.getState();
  const currentProgress = localProgresses.find(({ cardId }) => cardId === edit.cardId);
  if (currentProgress === undefined) throw new Error(`Local StudyProgress "${edit.cardId}" was not found`);

  const updatedProgress = studyProgressSchema.parse({ ...currentProgress, ...edit });
  studyProgressStore.setState({
    localProgresses: localProgresses.map((progress) =>
      progress.cardId === updatedProgress.cardId ? updatedProgress : progress
    ),
  });
  return updatedProgress;
};

export const deleteLocalStudyProgress = (cardId: string): void => {
  const id = studyProgressEditSchema.shape.cardId.parse(cardId);
  studyProgressStore.setState({
    localProgresses: studyProgressStore.getState().localProgresses.filter((progress) => progress.cardId !== id),
  });
};

export const deleteLocalStudyProgresses = (cardIds: string[]): void => {
  const ids = new Set(cardIds.map((cardId) => studyProgressEditSchema.shape.cardId.parse(cardId)));
  studyProgressStore.setState({
    localProgresses: studyProgressStore.getState().localProgresses.filter((progress) => !ids.has(progress.cardId)),
  });
};
