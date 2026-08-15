import { useStore } from "zustand";

import { studyProgressStore } from "./store";
import type { StudyProgress } from "./types";

export const useStudyProgresses = (): StudyProgress[] =>
  useStore(studyProgressStore, (state) => state.remoteProgresses);

export const useStudyProgress = (cardId: string | undefined): StudyProgress | undefined =>
  useStore(studyProgressStore, (state) => state.remoteProgresses.find((progress) => progress.cardId === cardId));
