import { deckEditPageStore as store } from "../store";

export function requestTagDeletion(tag: string | undefined): void {
  const state = store.getState();
  if (
    state.submission !== undefined ||
    state.pendingTagSave !== undefined ||
    state.deletionId !== undefined ||
    state.deletionTarget !== undefined
  )
    return;
  store.setState({ tagDeletion: tag });
}
