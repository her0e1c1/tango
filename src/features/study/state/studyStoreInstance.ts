import { createStudyStore } from "./studyStore";

export const studyStore = createStudyStore();

/**
 * Clears every study session, resets transient study controls, and removes persisted browser data.
 * The auth lifecycle awaits this before bootstrapping a new anonymous user.
 */
export const clearStudyStore = async (): Promise<void> => {
  studyStore.setState({
    sessionsByDeckId: {},
  });
  await studyStore.persist.clearStorage();
};
