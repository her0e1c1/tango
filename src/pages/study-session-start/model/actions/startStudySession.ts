import { getCards } from "@/entities/card";
import { buildStudyCardOrder } from "../queries/buildStudyCardOrder";
import { showToast } from "@/shared/ui/toast";
import { getAuthUid } from "@/entities/auth";
import { type DeckId, getDecks } from "@/entities/deck";
import { getPreferences } from "@/entities/preference";
import { selectStudyCards, startStudy } from "@/entities/study-session";
import type { DeckFilterValues } from "@/features/deck-filter";

let starting = false;

export async function startStudySession(deckId: DeckId, filter: DeckFilterValues): Promise<string | undefined> {
  if (starting) return;
  const deck = getDecks().find(({ id }) => id === deckId);
  if (deck === undefined) return;
  const uid = getAuthUid();
  if (uid === "" || deck.uid !== uid) return;
  const { study } = getPreferences();
  // Use the current draft even when its autosave has not reached the Deck yet.
  const now = Date.now();
  const cards = selectStudyCards(
    getCards().filter((card) => card.deckId === deckId),
    filter,
    study.useCardInterval,
    now
  );
  if (cards.length === 0) return;
  starting = true;
  try {
    return await startStudy({ deckId, cardOrderIds: buildStudyCardOrder(cards, study, now), uid, now });
  } catch {
    showToast({ messageKey: "toast.saveFailure", tone: "error" });
    return;
  } finally {
    starting = false;
  }
}
