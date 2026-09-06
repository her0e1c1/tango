import { type Card, type CardId, mustFindCardById } from "@/entities/card";
import type { RefObject } from "react";
import type { ToastId } from "@/shared/ui/toast";
import { dismissListError } from "./dismissListError";

export const requestCardDeletion = (
  cards: readonly Card[],
  id: CardId,
  errorToastId: RefObject<ToastId | undefined>,
  setTarget: (card: Card) => void
): void => {
  dismissListError(errorToastId);
  setTarget(mustFindCardById(cards, id));
};
