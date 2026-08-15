import { createStore } from "zustand/vanilla";

import type { StudyProgress } from "./types";

interface StudyProgressState {
  remoteProgresses: StudyProgress[];
}

export const studyProgressStore = createStore<StudyProgressState>(() => ({ remoteProgresses: [] }));

export const replaceRemoteStudyProgresses = (remoteProgresses: StudyProgress[]): void => {
  studyProgressStore.setState({ remoteProgresses });
};

export const clearRemoteStudyProgresses = (): void => {
  studyProgressStore.setState({ remoteProgresses: [] });
};
