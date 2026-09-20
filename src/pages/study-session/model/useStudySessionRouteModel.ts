import { useDeck } from "@/entities/deck";

export function useStudySessionRouteModel(deckId: string | undefined) {
  if (deckId == null) throw new Error("invalid deck id");
  const deck = useDeck(deckId);
  return { deckId, deck };
}
