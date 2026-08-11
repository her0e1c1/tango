export type DeckId = string;

export interface Deck {
  name: string;
  url?: string;
  isPublic: boolean;
  id: DeckId;
  uid: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
  tagAndFilter: boolean;
  category: string;
  convertToBr: boolean;
}

export type DeckFilterValues = Pick<Deck, "selectedTags" | "tagAndFilter" | "scoreMin" | "scoreMax">;

export type DeckFilterPatch =
  | Pick<DeckFilterValues, "selectedTags">
  | Pick<DeckFilterValues, "tagAndFilter">
  | Pick<DeckFilterValues, "scoreMin">
  | Pick<DeckFilterValues, "scoreMax">;

export const deckFilterValuesFrom = (deck: DeckFilterValues): DeckFilterValues => ({
  selectedTags: [...deck.selectedTags],
  tagAndFilter: deck.tagAndFilter,
  scoreMin: deck.scoreMin,
  scoreMax: deck.scoreMax,
});
