import { filterCardsByDeckId, useCards } from "@/entities/card";
import { mustFindDeckById, type DeckId, useDecks } from "@/entities/deck";

import { downloadDeckCsv } from "../lib/deckCsv";

export const useDeckExport = () => {
  const cards = useCards();
  const decks = useDecks();

  return (id: DeckId) => {
    const deck = mustFindDeckById(decks, id);
    downloadDeckCsv(deck, filterCardsByDeckId(cards, id));
  };
};
