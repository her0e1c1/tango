import { useState, useSyncExternalStore } from "react";
import { subscribeStudyAnswerHistory, type StudyAnswerHistory } from "@/entities/study-answer";
import type { StudyHistoryPeriod } from "@/entities/study-session";

function createAnswerRead(uid: string | null, deckId: string | null, period: StudyHistoryPeriod | null) {
  let snapshot: { history?: StudyAnswerHistory; error?: Error } | null = null;
  return {
    getSnapshot: () => snapshot,
    subscribe: (onChange: () => void) => {
      if (uid === null || period === null) return () => undefined;
      let active = true;
      const onError = (error: unknown) => {
        if (!active) return;
        snapshot = { error: error instanceof Error ? error : new Error(String(error)) };
        onChange();
      };
      let stop: (() => void) | undefined;
      try {
        stop = subscribeStudyAnswerHistory(
          { uid, deckId, from: period.start, to: period.end, limit: 1000 },
          (history) => {
            if (!active) return;
            snapshot = { history };
            onChange();
          },
          onError
        );
      } catch (error) {
        onError(error);
      }
      return () => {
        active = false;
        stop?.();
      };
    },
  };
}

export function useStudyAnswerHistoryState(
  uid: string | null,
  deckId: string | null,
  period: StudyHistoryPeriod | null,
  isAnonymous: boolean
) {
  const [retryVersion, setRetryVersion] = useState(0);
  const [request, setRequest] = useState(() => ({
    uid,
    deckId,
    period,
    isAnonymous,
    retryVersion,
    read: createAnswerRead(uid, deckId, period),
  }));
  if (
    request.uid !== uid ||
    request.deckId !== deckId ||
    request.period?.start !== period?.start ||
    request.period?.end !== period?.end ||
    request.isAnonymous !== isAnonymous ||
    request.retryVersion !== retryVersion
  ) {
    setRequest({ uid, deckId, period, isAnonymous, retryVersion, read: createAnswerRead(uid, deckId, period) });
  }
  const result = useSyncExternalStore(request.read.subscribe, request.read.getSnapshot);
  return { request, result, setRetryVersion };
}
