import type { UseFormReset } from "react-hook-form";

import { deckEditPageStore as store } from "../store";
import { saveTag } from "./saveTag";

export function submitTagName(
  tags: string[],
  values: { name: string },
  reset: UseFormReset<{ name: string }>,
  previous?: string
): void {
  if (saveTag(tags, values.name, previous)) {
    reset({ name: "" });
    store.setState({ editingTag: undefined });
  }
}
