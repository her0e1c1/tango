import { dismissToast } from "@/shared/ui/toast";
import { cardListStore } from "../store";

export function dismissListError(): void {
  const { errorToastId } = cardListStore.getState();
  if (errorToastId === undefined) return;
  dismissToast(errorToastId);
  cardListStore.setState({ errorToastId: undefined });
}
