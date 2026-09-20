import { studySessionStore } from "../store";
import type { StudySessionSyncStatus } from "../types";

export function getStudySessionSyncStatus(uid?: string): StudySessionSyncStatus {
  const state = studySessionStore.getState();
  return uid !== undefined && uid !== state.syncUid ? "loading" : state.syncStatus;
}
