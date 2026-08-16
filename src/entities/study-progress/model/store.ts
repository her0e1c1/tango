import { createStore } from "zustand/vanilla";

import type { StudyProgress } from "./types";

interface StudyProgressState {
  remoteProgressByCardId: Readonly<Record<string, StudyProgress>>;
}

export const studyProgressStore = createStore<StudyProgressState>()(() => ({
  remoteProgressByCardId: {},
}));

export const replaceRemoteStudyProgresses = (progresses: StudyProgress[]): void => {
  studyProgressStore.setState({
    remoteProgressByCardId: Object.fromEntries(progresses.map((progress) => [progress.cardId, progress])),
  });
};

export const clearRemoteStudyProgresses = (): void => {
  studyProgressStore.setState({ remoteProgressByCardId: {} });
};
