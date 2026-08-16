import { useStore } from "zustand";

import { studyProgressStore } from "./store";
import type { StudyProgress } from "./types";

/** @public Allows consumers to migrate from progress fields carried by Card in #604. */
export const useStudyProgress = (cardId: StudyProgress["cardId"] | undefined): StudyProgress | undefined =>
  useStore(studyProgressStore, (state) => (cardId === undefined ? undefined : state.remoteProgressByCardId[cardId]));
