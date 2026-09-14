import type { Card } from "@/entities/card";
import type { CardListStore } from "../store";
import { dismissListError } from "./dismissListError";

export function requestCardDeletion(store: CardListStore, card: Card): void {
  if (store.getState().mutationPending) return;
  dismissListError(store);
  store.setState({ deletionTarget: card });
}
