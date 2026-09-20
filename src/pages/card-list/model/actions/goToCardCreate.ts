import type { NavigateFunction } from "react-router-dom";
import type { DeckId } from "@/entities/deck";
import { routes } from "@/shared/router";

export function goToCardCreate(navigate: NavigateFunction, deckId: DeckId): void {
  void navigate(routes.cardCreate.to(deckId));
}
