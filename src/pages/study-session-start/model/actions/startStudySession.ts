import { buildStudyCardOrder } from "../queries/buildStudyCardOrder";
import { showToast } from "@/shared/ui/toast";
import { getAuthUid } from "@/entities/auth";
import { type DeckId, findDeckById } from "@/entities/deck";
import { getPreferences } from "@/entities/preference";
import { selectStudyCardsWithDeadline, startStudy } from "@/entities/study-session";
import type { DeckFilterValues } from "@/features/deck-filter";

let starting = false;

export async function startStudySession(deckId: DeckId, filter: DeckFilterValues): Promise<string | undefined> {
  if (starting) return;
  const deck = findDeckById(deckId);
  if (deck === undefined) return;
  const uid = getAuthUid();
  if (uid === "" || deck.uid !== uid) return;
  const { study } = getPreferences();
  // Use the current draft even when its autosave has not reached the Deck yet.
  const { cards } = selectStudyCardsWithDeadline(deckId, filter);
  if (cards.length === 0) return;
  const now = Date.now();
  starting = true;
  try {
    const sessionId = await startStudy({ deckId, cardOrderIds: buildStudyCardOrder(cards, study, now), uid, now });
    return getAuthUid() === uid ? sessionId : undefined;
  } catch {
    if (getAuthUid() === uid) showToast({ messageKey: "toast.saveFailure", tone: "error" });
    return;
  } finally {
    starting = false;
  }
}
