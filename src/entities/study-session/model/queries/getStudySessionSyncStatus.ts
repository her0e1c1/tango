import { studySessionStore } from "../store";
import type { StudySessionSyncStatus } from "../types";

export function getStudySessionSyncStatus(): StudySessionSyncStatus {
  return studySessionStore.getState().syncStatus;
}
