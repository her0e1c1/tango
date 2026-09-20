import { getAuthUid } from "@/entities/auth";
import type { Deck } from "@/entities/deck";
import { getStudySessionSyncStatus, startStudy } from "@/entities/study-session";

export function startDeckStudy(
  deck: Deck,
  cards: Parameters<typeof startStudy>[1],
  preferences: Parameters<typeof startStudy>[2]
): boolean {
  const uid = getAuthUid();
  const remote = uid !== "" && !deck.localMode;
  if (cards.length === 0 || (remote && getStudySessionSyncStatus(uid) !== "ready")) return false;
  startStudy(deck.id, cards, preferences, remote ? uid : undefined);
  return true;
}
