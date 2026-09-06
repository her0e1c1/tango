import { useState } from "react";
import type { Deck } from "@/entities/deck";
import { getInitialDeckFilterDraft } from "./queries/getInitialDeckFilterDraft";

export const useDeckFilterDraft = (uid: string, deck: Deck) => {
  // Keep the opening snapshot on subscription updates while restoring pending work across Pages.
  const [state, setState] = useState(() => getInitialDeckFilterDraft(uid, deck));
  if (state.key !== JSON.stringify([uid, deck.id])) setState(getInitialDeckFilterDraft(uid, deck));
  return { state, setState };
};
