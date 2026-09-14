import type { Card } from "@/entities/card";
import { cardListStore } from "../store";
import { dismissListError } from "./dismissListError";

export function requestCardDeletion(card: Card): void {
  if (cardListStore.getState().mutationPending) return;
  dismissListError();
  cardListStore.setState({ deletionTarget: card });
}
