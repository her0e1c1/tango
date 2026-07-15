import { useStore } from "zustand";

import { type StudyState, studyStore } from "@src/features/study/state/studyStore";

export const useStudyStore = <T>(selector: (state: StudyState) => T): T => useStore(studyStore, selector);
