import { studySessionStore } from "../store";

// Clears every live and persisted study session.
export const clearStudySessions = (): void => {
  // Publish the empty state before durable cleanup so auth changes cannot expose the previous user's sessions.
  studySessionStore.setState({ sessionsByDeckId: {} });
  studySessionStore.persist.clearStorage();
};
