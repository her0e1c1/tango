import type { UseFormReset } from "react-hook-form";

import { deckEditPageStore as store } from "../store";

export function editTagName(tag: string | undefined, reset: UseFormReset<{ name: string }>): void {
  if (store.getState().submission !== undefined || store.getState().pendingTagSave !== undefined) return;
  store.setState({ editingTag: tag });
  reset({ name: tag ?? "" });
}
