import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { z } from "zod";

import { createStudyProgress } from "./defaults";
import { persistedStudyProgressSchema, studyProgressEditSchema, studyProgressSchema } from "./schema";
import type { StudyProgress } from "./types";

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

const persistedStudyProgressStateSchema = z.object({
  localProgresses: z.array(persistedStudyProgressSchema),
});

const parsePersistedStudyProgressState = (value: unknown): PersistedStudyProgressState => {
  const result = persistedStudyProgressStateSchema.safeParse(value);
  return result.success ? result.data : { localProgresses: [] };
};

const createStudyProgressStore = ({ storage, skipHydration }: CreateStudyProgressStoreOptions = {}) => {
  const persistStorage = createJSONStorage<PersistedStudyProgressState>(() => storage ?? localStorage);
  return createStore<StudyProgressState>()(
    persist<StudyProgressState, [], [], PersistedStudyProgressState>(
      () => ({ remoteProgresses: [], localProgresses: [] }),
      {
        name: "tango-local-study-progresses",
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

export const replaceRemoteStudyProgresses = (remoteProgresses: StudyProgress[]): void => {
  studyProgressStore.setState({ remoteProgresses });
};

export const clearRemoteStudyProgresses = (): void => {
  studyProgressStore.setState({ remoteProgresses: [] });
};

export const createLocalStudyProgress = (cardId: string): StudyProgress => {
  const progress = studyProgressSchema.parse(createStudyProgress(studyProgressEditSchema.shape.cardId.parse(cardId)));
  const localProgresses = studyProgressStore.getState().localProgresses.filter((item) => item.cardId !== cardId);
  studyProgressStore.setState({ localProgresses: [...localProgresses, progress] });
  return progress;
};

export const editLocalStudyProgress = (input: unknown): StudyProgress => {
  const edit = studyProgressEditSchema.parse(input);
  const localProgresses = studyProgressStore.getState().localProgresses;
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
