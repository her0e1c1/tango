import { useParams } from "react-router-dom";

import { useCardViewState } from "./queries/useCardViewState";

export function useCardViewPageModel() {
  const { id: cardId } = useParams();
  if (cardId == null) throw new Error("invalid card id");

  return useCardViewState(cardId);
}
