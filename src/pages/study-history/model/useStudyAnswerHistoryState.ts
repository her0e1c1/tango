import { useState } from "react";
import type { StudyAnswerHistory } from "@/entities/study-answer";
import type { StudyHistoryPeriod } from "@/entities/study-session";

export function useStudyAnswerHistoryState(
  uid: string | null,
  deckId: string | null,
  period: StudyHistoryPeriod | null,
  isAnonymous: boolean
) {
  const [retryVersion, setRetryVersion] = useState(0);
  const [request, setRequest] = useState(() => ({ uid, deckId, period, isAnonymous, retryVersion }));
  const [result, setResult] = useState<{ request: typeof request; history?: StudyAnswerHistory; error?: Error } | null>(
    null
  );
  if (
    request.uid !== uid ||
    request.deckId !== deckId ||
    request.period?.start !== period?.start ||
    request.period?.end !== period?.end ||
    request.isAnonymous !== isAnonymous ||
    request.retryVersion !== retryVersion
  ) {
    setRequest({ uid, deckId, period, isAnonymous, retryVersion });
  }
  return { request, result: result?.request === request ? result : null, setResult, setRetryVersion };
}
