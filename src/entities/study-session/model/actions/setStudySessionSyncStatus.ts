import { studySessionStore } from "../store";
import type { StudySessionSyncStatus } from "../types";

export function setStudySessionSyncStatus(syncStatus: StudySessionSyncStatus): void {
  studySessionStore.setState({ syncStatus });
}
