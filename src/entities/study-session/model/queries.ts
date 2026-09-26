import { findCardsByDeckId } from "@/entities/card/@x/study-session";
import { calculateStudyCardSelection } from "./rules";
import { findDeckById, type DeckId } from "@/entities/deck/@x/study-session";
import { getPreferences } from "@/entities/preference/@x/study-session";
import { studySessionStore } from "./store";
import type { StudySession } from "./types";

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
