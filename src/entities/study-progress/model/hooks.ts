import { useMemo } from "react";
import { useStore } from "zustand";

import { studyProgressStore } from "./store";
import type { StudyProgress } from "./types";

export const useStudyProgresses = (): StudyProgress[] => {
  const remoteProgresses = useStore(studyProgressStore, (state) => state.remoteProgresses);
  const localProgresses = useStore(studyProgressStore, (state) => state.localProgresses);
  return useMemo(() => [...remoteProgresses, ...localProgresses], [localProgresses, remoteProgresses]);
};

export const useStudyProgress = (cardId: string | undefined): StudyProgress | undefined =>
  useStore(
    studyProgressStore,
    (state) =>
      state.remoteProgresses.find((progress) => progress.cardId === cardId) ??
      state.localProgresses.find((progress) => progress.cardId === cardId)
  );
