import { findCardsByDeckId } from "@/entities/card/@x/study-session";
import { calculateStudyCardSelection, getStudyHistory } from "./rules";
import { findDeckById, type DeckId } from "@/entities/deck/@x/study-session";
import { getPreferences } from "@/entities/preference/@x/study-session";
import { studySessionStore } from "./store";
import type { StudySession, StudyHistoryPeriod } from "./types";

export const getStudySession = (deckId: DeckId): StudySession | undefined =>
  studySessionStore.getState().sessionsByDeckId[deckId];

export function selectStudyCardsWithDeadline(
  deckId: DeckId,
  draft?: { selectedTags: readonly string[]; tagAndFilter: boolean }
) {
  const filter = draft ?? findDeckById(deckId);
  if (filter === undefined) return { cards: [], nextDueAt: undefined };
  return calculateStudyCardSelection(
    findCardsByDeckId(deckId),
    filter,
    getPreferences().study.useCardInterval,
    Date.now()
  );
}

export function isStudySessionOwner(uid: string): boolean {
  return studySessionStore.getState().ownerUid === uid;
}

export function queryStudyHistory(
  uid: string,
  period: StudyHistoryPeriod,
  deckId: string | null,
  metric: "started" | "completed"
) {
  const state = studySessionStore.getState();
  if (state.ownerUid !== uid || state.remoteLoading) return;
  if (state.syncError) return { error: state.syncError };
  return { records: getStudyHistory(state.history, period, deckId, metric), fromCache: state.fromCache };
}
