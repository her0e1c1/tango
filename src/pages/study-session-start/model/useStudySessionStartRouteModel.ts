import { useDeck } from "@/entities/deck";

export function useStudySessionStartRouteModel(id: string | undefined) {
  if (id === undefined) throw new Error("invalid deck id");
  return { deckId: id, deck: useDeck(id) };
}
