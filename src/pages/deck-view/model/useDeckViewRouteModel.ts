import { useParams } from "react-router-dom";
import { useAuth } from "@/entities/auth";
import { useDeck } from "@/entities/deck";

export function useDeckViewRouteModel() {
  const { id } = useParams();
  const deck = useDeck(id);
  const { uid } = useAuth();
  return { deck, ownerKey: JSON.stringify([uid, id]) };
}
