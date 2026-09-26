import { findCardsByDeckId } from "@/entities/card/@x/study-session";
import { selectStudyCardsWithDeadline as selectCardsWithDeadline } from "./rules";
import type { DeckId } from "@/entities/deck/@x/study-session";
import { studySessionStore } from "./store";
import type { StudySession } from "./types";

export const getStudySession = (deckId: DeckId): StudySession | undefined =>
  studySessionStore.getState().sessionsByDeckId[deckId];

export function selectStudyCardsWithDeadline(
  deckId: DeckId,
  filter: { selectedTags: readonly string[]; tagAndFilter: boolean },
  useCardInterval: boolean,
  now: number
) {
  return selectCardsWithDeadline(findCardsByDeckId(deckId), filter, useCardInterval, now);
}
