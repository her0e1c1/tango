import type { DeckFilterDraft } from "../types";

export const getDeckFilterState = (state: DeckFilterDraft) => ({
  ...state.draft,
  saving: state.pending !== undefined,
});
