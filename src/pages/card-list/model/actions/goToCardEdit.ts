import type { NavigateFunction } from "react-router-dom";
import type { CardId } from "@/entities/card";
import { routes } from "@/shared/router";

export function goToCardEdit(navigate: NavigateFunction, cardId: CardId): void {
  void navigate(routes.cardForm.to(cardId));
}
