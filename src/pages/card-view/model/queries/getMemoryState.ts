import { getStudyRetrievability, studyRetentionTarget, type FsrsState } from "@/entities/card";

export function getMemoryState(schedule: FsrsState | null, at: number) {
  if (schedule === null) return;
  const retrievability = getStudyRetrievability(schedule, at);
  const start = Math.min(schedule.lastReviewedAt, at, schedule.dueAt);
  const span = Math.max(schedule.lastReviewedAt, at, schedule.dueAt) - start;
  const end = Math.min(253_402_300_799_999, start + Math.max(span, 60_000) * 1.1);
  const times = new Set([schedule.lastReviewedAt, at, schedule.dueAt]);
  for (let index = 0; index <= 192; index++) {
    times.add(Math.round(start + (end - start) * (index / 192) ** 2));
  }
  return {
    at,
    start,
    end,
    retrievability,
    lastReviewedAt: schedule.lastReviewedAt,
    dueAt: schedule.dueAt,
    dueRetrievability: getStudyRetrievability(schedule, schedule.dueAt),
    isDue: schedule.dueAt <= at,
    target: studyRetentionTarget,
    // Never project the current memory state into time before the last rating.
    points: [...times]
      .filter((time) => time >= schedule.lastReviewedAt)
      .sort((a, b) => a - b)
      .map((time) => ({ time, probability: getStudyRetrievability(schedule, time) })),
  };
}
