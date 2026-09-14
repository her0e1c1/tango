import { dismissToast } from "@/shared/ui/toast";
import { deckCreatePageStore as store } from "../store";

export function dismissSaveError(): void {
  const { saveErrorToastId } = store.getState();
  if (saveErrorToastId === undefined) return;
  dismissToast(saveErrorToastId);
  store.setState({ saveErrorToastId: undefined });
}
