import { getCards } from "@/entities/card/@x/card-study-state";
import { getCardStudyStates } from "./getCardStudyStates";
import { joinStudyCards } from "../rules";
export function getStudyCards() {
  return joinStudyCards(getCards(), getCardStudyStates());
}
