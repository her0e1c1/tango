import type { DeckFilterValues } from "@/features/deck-filter";
import { MAX_DIFFICULTY, MIN_DIFFICULTY } from "@/entities/study-progress";
import type { CardListState } from "../store";

export function getCardListControls(
  state: Pick<CardListState, "mutationId" | "bulk" | "deletionTarget">,
  filter: Pick<DeckFilterValues, "difficultyMin" | "difficultyMax" | "selectedTags"> & { saving: boolean }
) {
  const mutationPending = state.mutationId !== undefined;
  return {
    mutationPending,
    busy: mutationPending || filter.saving,
    dialogOpen: state.bulk != null || state.deletionTarget != null,
    // Full-domain endpoints select every Card, so they are not active summary bounds.
    filterSummary: {
      difficultyMax: filter.difficultyMax === MAX_DIFFICULTY ? null : filter.difficultyMax,
      difficultyMin: filter.difficultyMin === MIN_DIFFICULTY ? null : filter.difficultyMin,
      selectedTags: filter.selectedTags,
    },
  };
}
