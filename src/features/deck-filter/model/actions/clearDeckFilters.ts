import type { UpdateDeckFilterOptions } from "../types";
import { updateDeckFilterDraft } from "./updateDeckFilterDraft";

export const clearDeckFilters = (options: UpdateDeckFilterOptions): void => {
  updateDeckFilterDraft(
    {
      selectedTags: [],
    },
    options
  );
};
