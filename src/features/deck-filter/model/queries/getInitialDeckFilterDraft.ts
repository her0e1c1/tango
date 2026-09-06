import type { Deck } from "@/entities/deck";
import { pendingFilters } from "../store";
import type { DeckFilterDraft } from "../types";

export const getInitialDeckFilterDraft = (uid: string, deck: Deck): DeckFilterDraft => {
  const key = JSON.stringify([uid, deck.id]);
  return (
    pendingFilters.get(key) ?? {
      key,
      draft: {
        difficultyMax: deck.difficultyMax,
        difficultyMin: deck.difficultyMin,
        selectedTags: [...deck.selectedTags],
        tagAndFilter: deck.tagAndFilter,
      },
    }
  );
};
