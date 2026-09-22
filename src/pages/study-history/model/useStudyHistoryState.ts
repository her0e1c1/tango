import { useEffect, useState } from "react";
import { subscribeStudyHistory, type StudyHistoryPeriod, type StudyHistoryRecord } from "@/entities/study-session";

type HistoryRead = { records: StudyHistoryRecord[]; fromCache: boolean };

export function useStudyHistoryState(uid: string | null, deckId: string | null, period: StudyHistoryPeriod | null) {
  const [retryVersion, setRetryVersion] = useState(0);
  const [request, setRequest] = useState(() => ({ uid, deckId, period, retryVersion }));
  const [result, setResult] = useState<{
    request: typeof request;
    started?: HistoryRead;
    completed?: HistoryRead;
    error?: Error;
  }>(() => ({ request }));

  if (
    request.uid !== uid ||
    request.deckId !== deckId ||
    request.period?.start !== period?.start ||
    request.period?.end !== period?.end ||
    request.retryVersion !== retryVersion
  ) {
    setRequest({ uid, deckId, period, retryVersion });
  }

  useEffect(() => {
    if (request.uid === null || request.period === null) return;
    let active = true;
    const stops: (() => void)[] = [];
    const onError = (error: Error) => {
      if (active) setResult({ request, error });
    };
    try {
      for (const metric of ["started", "completed"] as const) {
        stops.push(
          subscribeStudyHistory(
            { uid: request.uid, period: request.period, deckId: request.deckId, metric },
            (records, fromCache) => {
              if (!active) return;
              setResult((previous) => ({
                ...(previous.request === request ? previous : { request }),
                [metric]: { records, fromCache },
              }));
            },
            onError
          )
        );
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
    return () => {
      active = false;
      for (const stop of stops) stop();
    };
  }, [request]);

  return {
    setRetryVersion,
    period: request.period,
    result: result.request === request ? result : null,
  };
}
