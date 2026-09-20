import { useAuth } from "@/entities/auth";
import { useDeck } from "@/entities/deck";

export function useDeckViewRouteModel(deckId: string | undefined) {
  if (deckId == null) throw new Error("invalid deck id");
  const id = deckId;
  const deck = useDeck(id);
  const { uid } = useAuth();
  return { deck, ownerKey: JSON.stringify([uid, id]) };
}
