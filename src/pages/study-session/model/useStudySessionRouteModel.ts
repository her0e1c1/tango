import { useDeck } from "@/entities/deck";

export function useStudySessionRouteModel(deckId: string) {
  return useDeck(deckId);
}
