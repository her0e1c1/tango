import type { UpdateDeckFilterOptions } from "../types";
import { updateDeckFilterDraft } from "./updateDeckFilterDraft";

export function clearDeckFilters(options: UpdateDeckFilterOptions): void {
  updateDeckFilterDraft(
    {
      selectedTags: [],
      ...(options.scope === "card" ? { tagAndFilter: false } : {}),
    },
    options
  );
}
