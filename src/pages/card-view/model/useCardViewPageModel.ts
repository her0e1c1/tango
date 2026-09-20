import { useCardViewState } from "./queries/useCardViewState";

export function useCardViewPageModel(cardId: string | undefined) {
  if (cardId == null) throw new Error("invalid card id");

  return useCardViewState(cardId);
}
