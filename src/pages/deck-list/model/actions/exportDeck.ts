import { filterCardsByDeckId, type Card } from "@/entities/card";
import { mustFindDeckById, type Deck, type DeckId } from "@/entities/deck";
import { downloadDeckCsv } from "../../lib/deckCsv";

export const exportDeck = (id: DeckId, decks: Deck[], cards: Card[]): void => {
  const deck = mustFindDeckById(decks, id);
  downloadDeckCsv(deck, filterCardsByDeckId(cards, id));
};
