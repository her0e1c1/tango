import { getAuthUid } from "@/entities/auth";
import { filterCardsByDeckId, getCards } from "@/entities/card";
import { type DeckId, getDecks } from "@/entities/deck";
import { getPreferences } from "@/entities/preference";
import { selectStudyCards, startStudy } from "@/entities/study-session";
import type { DeckFilterValues } from "@/features/deck-filter";

export function startStudySession(deckId: DeckId, filter: DeckFilterValues): boolean {
  const deck = getDecks().find(({ id }) => id === deckId);
  if (deck === undefined) return false;
  const uid = getAuthUid();
  const remote = uid !== "" && !deck.localMode;
  const { study } = getPreferences();
  // Use the current draft even when its autosave has not reached the Deck yet.
  const cards = selectStudyCards(filterCardsByDeckId(getCards(), deckId), filter, study.useCardInterval);
  if (cards.length === 0) return false;
  startStudy(deckId, cards, study, remote ? uid : undefined);
  return true;
}
