import { filterCardsByDeckId, getCards } from "@/entities/card";
import { getDecks, mustFindDeckById, type DeckId } from "@/entities/deck";
import { downloadDeckCsv } from "../../lib/deckCsv";

export function exportDeck(id: DeckId): void {
  const deck = mustFindDeckById(getDecks(), id);
  downloadDeckCsv(deck, filterCardsByDeckId(getCards(), id));
}
