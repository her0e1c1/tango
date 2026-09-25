import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { syncPersistence, type SyncState, type SyncCheckpoint } from "@/shared/api";

export const studyAnswerStore = createStore<SyncState>()(
  persist(() => ({ sync: {} }), syncPersistence("tango-study-answer-sync"))
);

export function applyStudyAnswerSnapshot(scope: string, checkpoint: SyncCheckpoint | null | undefined) {
  if (checkpoint === undefined) return;
  const sync = { ...studyAnswerStore.getState().sync };
  if (checkpoint === null) delete sync[scope];
  else sync[scope] = checkpoint;
  return studyAnswerStore.setState({ sync });
}
