import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { z } from "zod";

import { persistedStudyProgressSchema, studyProgressEditSchema, studyProgressSchema } from "./schema";
import type { StudyProgress, StudyProgressEdit } from "./types";

/** Live StudyProgress collections separated by remote and local persistence ownership. */
interface StudyProgressState {
  remoteProgresses: StudyProgress[];
  localProgresses: StudyProgress[];
}

/** Browser-persisted subset of StudyProgress state. */
interface PersistedStudyProgressState {
  localProgresses: StudyProgress[];
}

/** Injectable persistence controls used to create an isolated StudyProgress store. */
interface CreateStudyProgressStoreOptions {
  storage?: StateStorage;
  skipHydration?: boolean;
}

const LOCAL_STUDY_PROGRESS_STORAGE_KEY = "tango-local-study-progresses";
const LEGACY_LOCAL_CARD_STORAGE_KEY = "tango-local-cards";

const persistedStudyProgressStateSchema = z.object({
  localProgresses: z.array(z.unknown()),
});

const legacyLocalCardProgressSchema = persistedStudyProgressSchema.omit({ cardId: true }).extend({
  id: studyProgressSchema.shape.cardId,
});
const legacyLocalCardStorageSchema = z.object({
  state: z.object({ localCards: z.array(z.unknown()) }),
  version: z.literal(1),
});

// Keeps every recoverable record so one damaged entry cannot hide otherwise valid local Cards after the join.
const parsePersistedStudyProgressState = (value: unknown): PersistedStudyProgressState => {
  const result = persistedStudyProgressStateSchema.safeParse(value);
  if (!result.success) return { localProgresses: [] };
  return {
    localProgresses: result.data.localProgresses.flatMap((progress) => {
      const parsedProgress = persistedStudyProgressSchema.safeParse(progress);
      return parsedProgress.success ? [parsedProgress.data] : [];
    }),
  };
};

// Extracts individually valid progress records from the released combined local Card payload.
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

// Writes the dedicated progress payload once before normal hydration can discard legacy Card fields.
const migrateLegacyLocalCardProgresses = (storage: Storage): void => {
  if (storage.getItem(LOCAL_STUDY_PROGRESS_STORAGE_KEY) !== null) return;
  const localProgresses = parseLegacyLocalCardProgresses(storage.getItem(LEGACY_LOCAL_CARD_STORAGE_KEY));
  if (localProgresses === null) return;
  // Creating the dedicated key is the migration marker, so compatibility never enters the normal runtime path.
  storage.setItem(LOCAL_STUDY_PROGRESS_STORAGE_KEY, JSON.stringify({ state: { localProgresses }, version: 1 }));
};

// Creates a StudyProgress store whose durable state contains only local progress.
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

export const studyProgressStore = createStudyProgressStore();

// Replaces the remote progress snapshot published with the active Card subscription.
export const replaceRemoteStudyProgresses = (remoteProgresses: StudyProgress[]): void => {
  studyProgressStore.setState({ remoteProgresses });
};

// Clears remote progress when its authentication scope ends.
export const clearRemoteStudyProgresses = (): void => {
  studyProgressStore.setState({ remoteProgresses: [] });
};

// Creates or replaces one local progress record after validating the complete model.
export const createLocalStudyProgress = (input: StudyProgress): StudyProgress => {
  const progress = studyProgressSchema.parse(input);
  const localProgresses = studyProgressStore
    .getState()
    .localProgresses.filter((item) => item.cardId !== progress.cardId);
  studyProgressStore.setState({ localProgresses: [...localProgresses, progress] });
  return progress;
};

// Applies a validated partial update to an existing local progress record.
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

// Deletes one local progress record after validating its Card identifier.
export const deleteLocalStudyProgress = (cardId: string): void => {
  const id = studyProgressEditSchema.shape.cardId.parse(cardId);
  studyProgressStore.setState({
    localProgresses: studyProgressStore.getState().localProgresses.filter((progress) => progress.cardId !== id),
  });
};

// Deletes every local progress record owned by the supplied Card identifiers.
export const deleteLocalStudyProgresses = (cardIds: string[]): void => {
  const ids = new Set(cardIds.map((cardId) => studyProgressEditSchema.shape.cardId.parse(cardId)));
  studyProgressStore.setState({
    localProgresses: studyProgressStore.getState().localProgresses.filter((progress) => !ids.has(progress.cardId)),
  });
};
