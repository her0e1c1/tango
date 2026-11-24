import { useState, useSyncExternalStore } from "react";
import { subscribeStudyHistory, type StudyHistoryPeriod, type StudyHistoryRecord } from "@/entities/study-session";

type HistoryRead = { records: StudyHistoryRecord[]; fromCache: boolean };

function createHistoryRead(uid: string | null, deckId: string | null, period: StudyHistoryPeriod | null) {
  let snapshot: { started?: HistoryRead; completed?: HistoryRead; error?: Error } | null = null;
  return {
    getSnapshot: () => snapshot,
    subscribe: (onChange: () => void) => {
      if (uid === null || period === null) return () => undefined;
      let active = true;
      const stops: (() => void)[] = [];
      const onError = (error: Error) => {
        if (!active) return;
        snapshot = { error };
        onChange();
      };
      const onRead = (metric: "started" | "completed") => (records: StudyHistoryRecord[], fromCache: boolean) => {
        if (!active) return;
        snapshot = { ...snapshot, [metric]: { records, fromCache } };
        onChange();
      };
      try {
        for (const metric of ["started", "completed"] as const) {
          stops.push(subscribeStudyHistory({ uid, period, deckId, metric }, onRead(metric), onError));
        }
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
      return () => {
        active = false;
        for (const stop of stops) stop();
      };
    },
  };
}

export function useStudyHistoryState(uid: string | null, deckId: string | null, period: StudyHistoryPeriod | null) {
  const [retryVersion, setRetryVersion] = useState(0);
  const [request, setRequest] = useState(() => ({
    uid,
    deckId,
    period,
    retryVersion,
    read: createHistoryRead(uid, deckId, period),
  }));
  if (
    request.uid !== uid ||
    request.deckId !== deckId ||
    request.period?.start !== period?.start ||
    request.period?.end !== period?.end ||
    request.retryVersion !== retryVersion
  ) {
    setRequest({ uid, deckId, period, retryVersion, read: createHistoryRead(uid, deckId, period) });
  }
  const result = useSyncExternalStore(request.read.subscribe, request.read.getSnapshot);
  return { setRetryVersion, period: request.period, result };
}
