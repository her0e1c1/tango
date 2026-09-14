import { dismissToast } from "@/shared/ui/toast";
import type { CardListStore } from "../store";

export function dismissListError(store: CardListStore): void {
  const { errorToastId } = store.getState();
  if (errorToastId === undefined) return;
  dismissToast(errorToastId);
  store.setState({ errorToastId: undefined });
}
