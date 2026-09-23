import type { Deck } from "@/entities/deck";
import type { useStudyHistoryState } from "../useStudyHistoryState";
import { getRecentStudySessions } from "./getRecentStudySessions";
import { aggregateStudyHistory } from "./aggregateStudyHistory";
import { getStudyHistoryChart } from "./getStudyHistoryChart";

export function getStudyHistoryView(
  uid: string,
  decks: Deck[],
  deckId: string | null,
  state: ReturnType<typeof useStudyHistoryState>
) {
  // Authentication becomes ready only after the current UID's Deck cache snapshot has loaded.
  const visibleDecks = decks.filter((deck) => deck.uid === uid);
  const selectedDecks = visibleDecks.filter((deck) => deckId === null || deck.id === deckId);
  const { result } = state;
  let status = "ready";
  if (state.period === null) status = "invalidRange";
  else if (uid === "") status = "loading";
  else if (deckId !== null && selectedDecks.length === 0) status = "unavailable";
  else if (result?.error) status = "error";
  else if (!result?.started || !result.completed) status = "loading";
  const summary =
    status === "ready" && result?.started && result.completed && state.period
      ? aggregateStudyHistory(
          state.period,
          result.started.records,
          result.completed.records,
          new Set(selectedDecks.map((deck) => deck.id))
        )
      : null;
  return {
    decks: visibleDecks,
    status,
    fromCache: Boolean(result?.started?.fromCache || result?.completed?.fromCache),
    recentSessions:
      status === "ready" && result?.started && result.completed && state.period
        ? getRecentStudySessions(state.period, result.started.records, result.completed.records, selectedDecks)
        : [],
    summary,
    chart: summary ? getStudyHistoryChart(summary.days) : null,
  };
}
