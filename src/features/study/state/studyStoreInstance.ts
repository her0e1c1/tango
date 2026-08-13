import { createStudyStore } from "./studyStore";

export const studyStore = createStudyStore();

/**
 * Clears every study session, resets transient study controls, and removes persisted browser data.
 * Logout awaits this function so a previous user's study progress cannot reappear after hydration.
 */
export const clearStudyStore = async (): Promise<void> => {
  studyStore.setState({
    sessionsByDeckId: {},
    showBackText: false,
    autoPlay: false,
    lastSwipe: undefined,
  });
  await studyStore.persist.clearStorage();
};
