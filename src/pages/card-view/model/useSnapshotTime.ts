import { useLayoutEffect, useState } from "react";
import type { FsrsState } from "@/entities/card-study-state";

export function useSnapshotTime(cardId: string, schedule: FsrsState | null) {
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
