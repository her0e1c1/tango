import { useState } from "react";
import { getCardFilter, type Deck } from "@/entities/deck";
import type { DeckFilterScope } from "./types";
import { areFiltersEqual } from "./rules";
import { getInitialDeckFilterDraft } from "./queries/getInitialDeckFilterDraft";

export const useDeckFilterDraft = (uid: string, deck: Deck, scope: DeckFilterScope = "study") => {
  // Study keeps its opening snapshot; browsing follows subscription updates after pending edits finish.
  const [state, setState] = useState(() => getInitialDeckFilterDraft(uid, deck, scope));
  const saved = getCardFilter(deck);
  const [observed, setObserved] = useState(saved);
  const current = getInitialDeckFilterDraft(uid, deck, scope);
  if (state.key !== current.key || (scope === "card" && !state.pending && !areFiltersEqual(observed, saved))) {
    setObserved(saved);
    setState(current);
  }
  return { state, setState };
};
