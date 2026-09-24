import { compareSyncTimestamps, type SyncedQueryResult } from "@/shared/api";
import type { StudyAnswerHistory, StudyAnswerSnapshot } from "../types";

export function getStudyAnswerHistory(
  result: SyncedQueryResult<StudyAnswerSnapshot>,
  maximum: number
): StudyAnswerHistory {
  const ordered = [...result.values].sort(
    (left, right) =>
      compareSyncTimestamps(right.answeredAt, left.answeredAt) || (left.id < right.id ? 1 : left.id > right.id ? -1 : 0)
  );
  const selected = ordered.slice(0, maximum);
  return {
    records: selected.flatMap(({ record }) => (record === null ? [] : [record])),
    invalidCount: selected.filter(({ record }) => record === null).length,
    truncated: ordered.length > maximum,
    source: result.fromCache ? "cache" : "server",
    hasPendingWrites: result.hasPendingWrites,
  };
}
