import { useParams } from "react-router-dom";
import { useDeck } from "@/entities/deck";

export function useStudySessionStartRouteModel() {
  const { id } = useParams();
  if (id === undefined) throw new Error("invalid deck id");
  return { deckId: id, deck: useDeck(id) };
}
