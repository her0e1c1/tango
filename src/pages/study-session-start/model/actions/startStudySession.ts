import { showToast } from "@/shared/ui/toast";
import { getAuthUid } from "@/entities/auth";
import { filterCardsByDeckId, getCards } from "@/entities/card";
import { type DeckId, getDecks } from "@/entities/deck";
import { getPreferences } from "@/entities/preference";
import { selectStudyCards, startStudy } from "@/entities/study-session";
import type { DeckFilterValues } from "@/features/deck-filter";

let starting = false;

export async function startStudySession(deckId: DeckId, filter: DeckFilterValues): Promise<boolean> {
  if (starting) return false;
  const deck = getDecks().find(({ id }) => id === deckId);
  if (deck === undefined) return false;
  const uid = getAuthUid();
  if (uid === "" || deck.uid !== uid) return false;
  const { study } = getPreferences();
  // Use the current draft even when its autosave has not reached the Deck yet.
  const now = Date.now();
  const cards = selectStudyCards(filterCardsByDeckId(getCards(), deckId), filter, study.useCardInterval, now);
  if (cards.length === 0) return false;
  starting = true;
  try {
    await startStudy({ deckId, cards, preferences: study, uid, now });
    return true;
  } catch {
    showToast({ messageKey: "toast.saveFailure", tone: "error" });
    return false;
  } finally {
    starting = false;
  }
}
