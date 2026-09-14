import type { CardListStore } from "../store";
import { dismissListError } from "./dismissListError";

export function cancelBulkDifficulty(store: CardListStore): void {
  if (store.getState().mutationPending) return;
  dismissListError(store);
  store.setState({ bulkCardIds: undefined });
}
