import type { UseFormReset } from "react-hook-form";

import { deckEditPageStore as store } from "../store";

export function editTagName(tag: string | undefined, reset: UseFormReset<{ name: string }>): void {
  if (store.getState().tagMutation !== undefined) return;
  store.setState({ editingTag: tag, tagError: undefined });
  reset({ name: tag ?? "" });
}
