import { useStore } from "zustand";
import { cardStudyStateStore } from "../store";
export function useCardStudyStates() {
  const { states, error } = useStore(cardStudyStateStore);
  if (error) throw error;
  return states;
}
