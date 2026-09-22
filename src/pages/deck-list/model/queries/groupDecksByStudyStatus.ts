import type { Deck } from "@/entities/deck";
import type { StudySession } from "@/entities/study-session";

export function groupDecksByStudyStatus(
  decks: readonly Deck[],
  sessionsByDeckId: Readonly<Partial<Record<Deck["id"], StudySession>>>
) {
  const active: { deck: Deck; session: StudySession }[] = [];
  const inactive: Deck[] = [];
  for (const deck of decks) {
    const session = sessionsByDeckId[deck.id];
    if (session == null) inactive.push(deck);
    else active.push({ deck, session });
  }
  return { active, inactive };
}
