import type { SyncCheckpoint } from "@/shared/api";
import { studyAnswerStore } from "../store";

export function applyStudyAnswerSnapshot(scope: string, checkpoint: SyncCheckpoint | null | undefined) {
  if (checkpoint === undefined) return;
  const sync = { ...studyAnswerStore.getState().sync };
  if (checkpoint === null) delete sync[scope];
  else sync[scope] = checkpoint;
  return studyAnswerStore.setState({ sync });
}
