import type { DeckFilterValues } from "./types";

export const areFiltersEqual = (left: DeckFilterValues, right: DeckFilterValues): boolean =>
  left.tagAndFilter === right.tagAndFilter &&
  left.selectedTags.length === right.selectedTags.length &&
  left.selectedTags.every((tag, index) => tag === right.selectedTags[index]);
