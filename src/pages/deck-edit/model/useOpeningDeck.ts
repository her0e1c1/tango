import { useState } from "react";

import { type Deck, useDeck } from "@/entities/deck";

export function useOpeningDeck(deckId: Deck["id"]) {
  const deck = useDeck(deckId);
  const [opening, setOpening] = useState({ deckId, deck });

  // Accept a late arrival once, then preserve the draft and stay mounted through our own deletion.
  if (opening.deckId !== deckId || (opening.deck === undefined && deck !== undefined)) {
    setOpening({ deckId, deck });
  }

  return opening.deckId === deckId ? opening.deck : deck;
}
