import { useEffect } from "react";
import { readStudyAnswerHistory } from "@/entities/study-answer";
import type { useStudyAnswerHistoryState } from "../useStudyAnswerHistoryState";

export function useLoadStudyAnswers({
  request,
  setResult,
}: Pick<ReturnType<typeof useStudyAnswerHistoryState>, "request" | "setResult">) {
  useEffect(() => {
    if (request.uid === null || request.period === null) return;
    let active = true;
    void readStudyAnswerHistory({
      uid: request.uid,
      deckId: request.deckId,
      from: request.period.start,
      to: request.period.end,
      limit: 1000,
    }).then(
      (history) => {
        if (active) setResult({ request, history });
      },
      (error: unknown) => {
        if (active) setResult({ request, error: error instanceof Error ? error : new Error(String(error)) });
      }
    );
    return () => {
      active = false;
    };
  }, [request, setResult]);
}
