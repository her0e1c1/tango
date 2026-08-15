import { useState } from "react";

import { useAuthUid } from "@/entities/auth";
import { type Deck, editDeck } from "@/entities/deck";

export interface DeckFilterState {
  scoreMax: number | null;
  scoreMin: number | null;
  selectedTags: string[];
  tagAndFilter: boolean;
  setScoreMax: (value: number | null) => void;
  setScoreMin: (value: number | null) => void;
  setSelectedTags: (value: string[]) => void;
  setTagAndFilter: (value: boolean) => void;
}

type DeckFilterValues = Pick<Deck, "scoreMax" | "scoreMin" | "selectedTags" | "tagAndFilter">;

export const useDeckFilterState = (deck: Deck): DeckFilterState => {
  const uid = useAuthUid();
  const [filter, setFilter] = useState<DeckFilterValues>(() => ({
    scoreMax: deck.scoreMax,
    scoreMin: deck.scoreMin,
    selectedTags: deck.selectedTags,
    tagAndFilter: deck.tagAndFilter,
  }));

  const updateFilter = <Key extends keyof DeckFilterValues>(key: Key, value: DeckFilterValues[Key]) => {
    setFilter((current) => ({ ...current, [key]: value }));
    void editDeck(uid, { id: deck.id, [key]: value }).catch(() => undefined);
  };

  return {
    ...filter,
    setScoreMax: (value) => updateFilter("scoreMax", value),
    setScoreMin: (value) => updateFilter("scoreMin", value),
    setSelectedTags: (value) => updateFilter("selectedTags", value),
    setTagAndFilter: (value) => updateFilter("tagAndFilter", value),
  };
};
