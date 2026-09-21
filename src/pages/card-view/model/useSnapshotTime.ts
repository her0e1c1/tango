import { useLayoutEffect, useState } from "react";
import type { StudySchedule } from "@/entities/study-schedule";

export function useSnapshotTime(cardId: string, schedule: StudySchedule | undefined) {
  // Firestore snapshots can replace schedule objects without changing their values.
  const scheduleKey = JSON.stringify(schedule);
  const [at, setAt] = useState(() => Date.now());
  useLayoutEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") setAt(Date.now());
    };
    refresh();
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [cardId, scheduleKey]);
  return at;
}
