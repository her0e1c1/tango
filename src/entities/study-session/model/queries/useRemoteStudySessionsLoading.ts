import { useStore } from "zustand";
import { studySessionStore } from "../store";

export function useRemoteStudySessionsLoading(): boolean {
  return useStore(studySessionStore, (state) => state.remoteLoading);
}
