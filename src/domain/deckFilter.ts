/** @file Defines the editable Deck filter fields shared by forms and persistence adapters. */

export type DeckFilterPatch = Pick<Deck, "selectedTags" | "tagAndFilter" | "scoreMin" | "scoreMax">;

/** Returns only the filter fields that the auto-saving filter form is allowed to update. */
export const deckFilterPatchFrom = (deck: DeckFilterPatch): DeckFilterPatch => ({
  selectedTags: [...deck.selectedTags],
  tagAndFilter: deck.tagAndFilter,
  scoreMin: deck.scoreMin,
  scoreMax: deck.scoreMax,
});
