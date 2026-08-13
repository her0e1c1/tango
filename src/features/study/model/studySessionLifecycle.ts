import { clearStudyStore, studyStore, type StudyState } from "../state/studyStore";

type StudySessionTeardown = () => Promise<void>;

export const createStudySessionTeardown = (): StudySessionTeardown => {
  let completed = false;
  let stateAfterClear: StudyState | undefined;

  return async () => {
    if (completed) return;
    if (stateAfterClear && studyStore.getState() !== stateAfterClear) {
      completed = true;
      return;
    }

    if (!stateAfterClear) {
      const cleanup = clearStudyStore();
      stateAfterClear = studyStore.getState();
      await cleanup;
    } else {
      await studyStore.persist.clearStorage();
    }
    completed = true;
  };
};
