import { cardStudyStateStore } from "../store";
export function clearCardStudyStates() {
  cardStudyStateStore.setState({ states: {}, error: undefined });
}
