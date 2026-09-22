import { getCardStudyStates } from "./getCardStudyStates";
export function getCardStudyState(cardId: string) {
  return getCardStudyStates()[cardId];
}
