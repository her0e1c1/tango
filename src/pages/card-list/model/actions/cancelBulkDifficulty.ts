import { cardListStore } from "../store";
import { dismissListError } from "./dismissListError";

export function cancelBulkDifficulty(): void {
  if (cardListStore.getState().mutationPending) return;
  dismissListError();
  cardListStore.setState({ bulkCardIds: undefined });
}
