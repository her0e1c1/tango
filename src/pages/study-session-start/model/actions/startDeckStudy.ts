import type { Deck } from "@/entities/deck";
import { getStudySessionSyncStatus, startStudy } from "@/entities/study-session";

export function startDeckStudy(
  { uid, isAnonymous }: { uid: string; isAnonymous: boolean },
  deck: Deck,
  cards: Parameters<typeof startStudy>[1],
  preferences: Parameters<typeof startStudy>[2]
): boolean {
  const remote = !isAnonymous && !deck.localMode;
  if (cards.length === 0 || (remote && getStudySessionSyncStatus() !== "ready")) return false;
  startStudy(deck.id, cards, preferences, remote ? uid : undefined);
  return true;
}
