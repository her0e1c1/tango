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
  const { result, period } = state;
  const { started, completed } = result ?? {};
  let status = "ready";
  if (period === null) status = "invalidRange";
  else if (uid === "") status = "loading";
  else if (deckId !== null && selectedDecks.length === 0) status = "unavailable";
  else if (result?.error) status = "error";
  else if (!started || !completed) status = "loading";
  const fromCache = Boolean(started?.fromCache || completed?.fromCache);
  if (status !== "ready" || !started || !completed || !period) {
    return { decks: visibleDecks, status, fromCache, recentSessions: [], summary: null, chart: null };
  }
  const summary = aggregateStudyHistory(
    period,
    started.records,
    completed.records,
    new Set(selectedDecks.map((deck) => deck.id))
  );
  return {
    decks: visibleDecks,
    status,
    fromCache,
    recentSessions: getRecentStudySessions(period, started.records, completed.records, selectedDecks),
    summary,
    chart: getStudyHistoryChart(summary.days),
  };
}
