import type { Deck } from "@/entities/deck";
import type { useStudyAnswerHistoryState } from "../useStudyAnswerHistoryState";
import { aggregateStudyAnswers } from "./aggregateStudyAnswers";

export function getStudyAnswerHistoryView(state: ReturnType<typeof useStudyAnswerHistoryState>, decks: Deck[]) {
  const { request, result } = state;
  const selected = decks.filter(
    (deck) => deck.uid === request.uid && (request.deckId === null || deck.id === request.deckId)
  );
  const summary =
    result?.history && request.period
      ? aggregateStudyAnswers(request.period, result.history, new Set(selected.map((deck) => deck.id)))
      : null;
  return {
    status:
      request.period === null
        ? "invalidRange"
        : request.uid === null
          ? "loading"
          : request.deckId !== null && selected.length === 0
            ? "unavailable"
            : result?.error
              ? "error"
              : !summary
                ? "loading"
                : summary.source === "cache"
                  ? "cache-limited"
                  : summary.truncated
                    ? "truncated"
                    : !summary.complete
                      ? "incomplete"
                      : summary.ratedAnswerCount === 0
                        ? "empty"
                        : "ready",
    summary,
    error: result?.error,
  };
}
