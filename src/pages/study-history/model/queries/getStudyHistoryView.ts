import type { Deck } from "@/entities/deck";
import type { useStudyHistoryState } from "../useStudyHistoryState";
import { aggregateStudyHistory } from "./aggregateStudyHistory";

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
  const status =
    uid === ""
      ? "loading"
      : deckId !== null && selectedDecks.length === 0
        ? "unavailable"
        : result?.error
          ? "error"
          : !result?.started || !result.completed
            ? "loading"
            : "ready";
  return {
    decks: visibleDecks,
    status,
    fromCache: Boolean(result?.started?.fromCache || result?.completed?.fromCache),
    summary:
      status === "ready" && result?.started && result.completed
        ? aggregateStudyHistory(
            state.period,
            result.started.records,
            result.completed.records,
            new Set(selectedDecks.map((deck) => deck.id))
          )
        : null,
  };
}
