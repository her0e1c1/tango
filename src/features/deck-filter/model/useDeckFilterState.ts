import { useState } from "react";

import { useAuthUid } from "@/entities/auth";
import { type Deck, editDeck, useDeck } from "@/entities/deck";

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

export const useDeckFilterState = (deckId: string): DeckFilterState | undefined => {
  const uid = useAuthUid();
  const deck = useDeck(deckId);
  const [filter, setFilter] = useState<DeckFilterValues>();

  // Keep deriving the initial view until the first local edit because a remote Deck can arrive after this hook mounts.
  const storedFilter: DeckFilterValues | undefined =
    deck == null
      ? undefined
      : {
          scoreMax: deck.scoreMax,
          scoreMin: deck.scoreMin,
          selectedTags: deck.selectedTags,
          tagAndFilter: deck.tagAndFilter,
        };

  const updateFilter = <Key extends keyof DeckFilterValues>(key: Key, value: DeckFilterValues[Key]) => {
    if (storedFilter == null) return;
    setFilter((current) => ({ ...(current ?? storedFilter), [key]: value }));
    void editDeck(uid, { id: deckId, [key]: value }).catch(() => undefined);
  };

  const currentFilter = filter ?? storedFilter;
  if (currentFilter == null) return;

  return {
    ...currentFilter,
    setScoreMax: (value) => updateFilter("scoreMax", value),
    setScoreMin: (value) => updateFilter("scoreMin", value),
    setSelectedTags: (value) => updateFilter("selectedTags", value),
    setTagAndFilter: (value) => updateFilter("tagAndFilter", value),
  };
};
