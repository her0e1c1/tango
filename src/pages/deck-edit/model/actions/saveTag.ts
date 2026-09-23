import { showToast } from "@/shared/ui/toast";

import { deckEditPageStore as store } from "../store";
import { persistTagChange } from "./persistTagChange";

export async function saveTag(deckId: string, name: string | undefined, previous?: string): Promise<boolean> {
  const state = store.getState();
  if (
    state.tagMutation !== undefined ||
    state.submission !== undefined ||
    state.deletionTarget !== undefined ||
    state.deletionId !== undefined
  )
    return false;
  if (name !== undefined && name.trim().length === 0) {
    store.setState({ tagError: "required" });
    return false;
  }
  const mutation = Symbol("tag-update");
  store.setState({ tagMutation: mutation, tagError: undefined });
  try {
    if (!(await persistTagChange(deckId, name, previous, mutation))) return false;
    if (store.getState().tagMutation !== mutation) return false;
    store.setState({ tagDeletion: undefined });
    showToast({ messageKey: "deckTags.saved", tone: "success" });
    return true;
  } catch {
    if (store.getState().tagMutation === mutation) showToast({ messageKey: "deckTags.failed", tone: "error" });
    return false;
  } finally {
    if (store.getState().tagMutation === mutation) store.setState({ tagMutation: undefined });
  }
}
