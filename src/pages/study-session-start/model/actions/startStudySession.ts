import { filterCardsByDeckId, getCards } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { getPreferences } from "@/entities/preference";
import { selectStudyCards, startStudy } from "@/entities/study-session";
import type { DeckFilterValues } from "@/features/deck-filter";

export function startStudySession(deckId: DeckId, filter: DeckFilterValues): boolean {
  const { study } = getPreferences();
  // Use the current draft even when its autosave has not reached the Deck yet.
  const cards = selectStudyCards(filterCardsByDeckId(getCards(), deckId), filter, study.useCardInterval);
  if (cards.length === 0) return false;
  startStudy(deckId, cards, study);
  return true;
}
