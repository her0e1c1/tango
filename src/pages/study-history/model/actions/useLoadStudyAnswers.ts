import { useEffect } from "react";
import { subscribeStudyAnswerHistory } from "@/entities/study-answer";
import type { useStudyAnswerHistoryState } from "../useStudyAnswerHistoryState";

export function useLoadStudyAnswers({
  request,
  setResult,
}: Pick<ReturnType<typeof useStudyAnswerHistoryState>, "request" | "setResult">) {
  useEffect(() => {
    if (request.uid === null || request.period === null) return;
    let active = true;
    const onError = (error: unknown) => {
      if (active) setResult({ request, error: error instanceof Error ? error : new Error(String(error)) });
    };
    let stop: (() => void) | undefined;
    try {
      stop = subscribeStudyAnswerHistory(
        {
          uid: request.uid,
          deckId: request.deckId,
          from: request.period.start,
          to: request.period.end,
          limit: 1000,
        },
        (history) => {
          if (active) setResult({ request, history });
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
  }, [request, setResult]);
}
