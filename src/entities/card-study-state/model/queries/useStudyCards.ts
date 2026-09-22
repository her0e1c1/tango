import { useCards } from "@/entities/card/@x/card-study-state";
import { useCardStudyStates } from "./useCardStudyStates";
import { joinStudyCards } from "../rules";
export function useStudyCards() {
  return joinStudyCards(useCards(), useCardStudyStates());
}
