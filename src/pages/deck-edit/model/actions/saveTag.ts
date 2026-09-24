import { deckEditPageStore as store } from "../store";

export function saveTag(tags: string[], name: string | undefined, previous?: string): boolean {
  const state = store.getState();
  if (
    state.submission !== undefined ||
    state.pendingTagSave !== undefined ||
    state.deletionTarget !== undefined ||
    state.deletionId !== undefined
  )
    return false;
  if (name !== undefined && name.trim().length === 0) {
    store.setState({ tagError: "required" });
    return false;
  }
  if (name !== previous && name !== undefined && tags.includes(name)) {
    store.setState({ tagError: "duplicate" });
    return false;
  }
  if (previous !== undefined && !tags.includes(previous)) return false;
  if (name !== previous) {
    const next = tags.filter((tag) => tag !== previous);
    if (name !== undefined) next.push(name);
    store.setState({ draftTags: next, tagChanges: [...state.tagChanges, { previous, name }] });
  }
  store.setState({ tagDeletion: undefined, tagError: undefined });
  return true;
}
