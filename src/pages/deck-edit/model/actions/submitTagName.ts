import type { UseFormReset } from "react-hook-form";

import { deckEditPageStore as store } from "../store";
import { saveTag } from "./saveTag";

export async function submitTagName(
  deckId: string,
  values: { name: string },
  reset: UseFormReset<{ name: string }>,
  previous?: string
): Promise<void> {
  if (await saveTag(deckId, values.name, previous)) {
    reset({ name: "" });
    store.setState({ editingTag: undefined });
  }
}
