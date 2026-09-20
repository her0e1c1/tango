import { updateDeckFilterDraft, type UpdateDeckFilterOptions } from "@/features/deck-filter";

export function removeCardListTag(tag: string, options: UpdateDeckFilterOptions): void {
  updateDeckFilterDraft(
    { selectedTags: options.draft.selectedTags.filter((selectedTag) => selectedTag !== tag) },
    options
  );
}
