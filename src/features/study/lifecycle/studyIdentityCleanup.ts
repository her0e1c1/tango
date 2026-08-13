import { clearStudyStore, studyStore, type StudyState } from "../state/studyStore";

export type StudyIdentityCleanup = () => Promise<void>;

/**
 * Creates a retryable cleanup operation for an identity transition.
 * A retry becomes obsolete when study state changes after the initial reset, because that state
 * belongs to the next identity and its persisted data must not be removed.
 */
export const createStudyIdentityCleanup = (): StudyIdentityCleanup => {
  let stateAfterClear: StudyState | undefined;
  let completed = false;

  return async () => {
    if (completed) return;
    if (stateAfterClear && studyStore.getState() !== stateAfterClear) {
      completed = true;
      return;
    }

    const cleanup = clearStudyStore();
    stateAfterClear = studyStore.getState();
    await cleanup;
    completed = true;
  };
};
