import { cardStudyStateStore } from "../store";
export function getCardStudyStates() {
  const { states, error } = cardStudyStateStore.getState();
  if (error) throw error;
  return states;
}
