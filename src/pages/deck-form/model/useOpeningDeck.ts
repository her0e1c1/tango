import { useState } from "react";

import { type Deck, useDeck } from "@/entities/deck";

export function useOpeningDeck(deckId: Deck["id"]) {
  const deck = useDeck(deckId);
  const [openingDeck, setOpeningDeck] = useState(deck);

  // Accept a late arrival once, then preserve the draft and stay mounted through our own deletion.
  if (openingDeck === undefined && deck !== undefined) setOpeningDeck(deck);

  return openingDeck;
}
