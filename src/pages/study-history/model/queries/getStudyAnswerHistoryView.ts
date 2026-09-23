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
  let status = "ready";
  if (request.period === null) status = "invalidRange";
  else if (request.uid === null) status = "loading";
  else if (request.deckId !== null && selected.length === 0) status = "unavailable";
  else if (result?.error) status = "error";
  else if (!summary) status = "loading";
  else if (summary.source === "cache") status = "cache-limited";
  else if (summary.truncated) status = "truncated";
  else if (!summary.complete) status = "incomplete";
  else if (summary.ratedAnswerCount === 0) status = "empty";
  return {
    status,
    summary,
    error: result?.error,
  };
}
