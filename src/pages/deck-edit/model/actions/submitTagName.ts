import type { UseFormReset, UseFormSetValue } from "react-hook-form";

import type { DeckEditFormFields } from "../useDeckEditFormState";

import { deckEditPageStore as store } from "../store";
import { saveTag } from "./saveTag";

export function submitTagName(
  tags: string[],
  values: { name: string; previous?: string | undefined },
  reset: UseFormReset<{ name: string }>,
  setValue: UseFormSetValue<DeckEditFormFields>
): void {
  if (saveTag(tags, values.name, setValue, values.previous)) {
    reset({ name: "" });
    store.setState({ editingTag: undefined });
  }
}
