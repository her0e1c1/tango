import { cardStudyStateStore } from "../store";
import type { CardStudyStateDocument } from "../../api/document";
export function replaceCardStudyStates(states: CardStudyStateDocument[]) {
  cardStudyStateStore.setState({
    states: Object.fromEntries(states.map((state) => [state.cardId, state])),
    error: undefined,
  });
}
