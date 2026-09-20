import { useStore } from "zustand";
import { studySessionStore } from "../store";
import type { StudySessionSyncStatus } from "../types";

export function useStudySessionSyncStatus(): StudySessionSyncStatus {
  return useStore(studySessionStore, (state) => state.syncStatus);
}
