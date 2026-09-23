import { getCardFilter, type Deck } from "@/entities/deck";
import { pendingFilters } from "../store";
import type { DeckFilterDraft, DeckFilterScope } from "../types";

export const getInitialDeckFilterDraft = (
  uid: string,
  deck: Deck,
  scope: DeckFilterScope = "study"
): DeckFilterDraft => {
  const key = JSON.stringify([uid, deck.id, scope]);
  const filter = scope === "card" ? getCardFilter(deck) : deck;
  return (
    pendingFilters.get(key) ?? {
      key,
      draft: {
        selectedTags: [...filter.selectedTags],
        tagAndFilter: filter.tagAndFilter,
      },
    }
  );
};
