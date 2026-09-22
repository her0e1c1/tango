import type { DeckFilterValues } from "@/features/deck-filter";
import type { CardListState } from "../store";

export function getCardListControls(
  state: Pick<CardListState, "mutationId" | "deletionTarget">,
  filter: Pick<DeckFilterValues, "selectedTags"> & { saving: boolean }
) {
  const mutationPending = state.mutationId !== undefined;
  return {
    mutationPending,
    busy: mutationPending || filter.saving,
    dialogOpen: state.deletionTarget != null,
    filterSummary: {
      selectedTags: filter.selectedTags,
    },
  };
}
