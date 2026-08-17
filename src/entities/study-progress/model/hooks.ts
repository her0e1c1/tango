import { useStore } from "zustand";

import { studyProgressStore } from "./store";
import type { StudyProgress } from "./types";

// Reads remote and local progress as one ordered collection.
export const useStudyProgresses = (): StudyProgress[] => {
  const state = useStore(studyProgressStore);
  return [...state.remoteProgresses, ...state.localProgresses];
};

// Reads one Card's progress across both persistence modes.
export const useStudyProgress = (cardId: StudyProgress["cardId"] | undefined): StudyProgress | undefined =>
  useStore(
    studyProgressStore,
    (state) =>
      state.remoteProgresses.find((progress) => progress.cardId === cardId) ??
      state.localProgresses.find((progress) => progress.cardId === cardId)
  );
