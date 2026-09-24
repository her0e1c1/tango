import type { UseFormSetValue } from "react-hook-form";

import type { DeckEditFormFields } from "../useDeckEditFormState";
import { deckEditPageStore as store } from "../store";

export function saveTag(
  tags: string[],
  name: string | undefined,
  setValue: UseFormSetValue<DeckEditFormFields>,
  previous?: string
): boolean {
  const state = store.getState();
  if (
    state.submission !== undefined ||
    state.pendingTagSave !== undefined ||
    state.deletionTarget !== undefined ||
    state.deletionId !== undefined
  )
    return false;
  if (previous !== undefined && !tags.includes(previous)) return false;
  if (name !== previous) {
    const next = tags.filter((tag) => tag !== previous);
    if (name !== undefined) next.push(name);
    setValue("tags", next, { shouldDirty: true });
    store.setState({ tagChanges: [...state.tagChanges, { previous, name }] });
  }
  store.setState({ tagDeletion: undefined });
  return true;
}
