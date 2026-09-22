import type { StudySession } from "@/entities/study-session";

// Recent study comes first; names provide a stable presentation order for ties.
export function compareActiveDecks(
  left: { deck: { name: string }; session: StudySession },
  right: { deck: { name: string }; session: StudySession }
): number {
  return right.session.lastStudiedAt - left.session.lastStudiedAt || left.deck.name.localeCompare(right.deck.name);
}
