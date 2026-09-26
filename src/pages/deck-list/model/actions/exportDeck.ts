import { findCardsByDeckId } from "@/entities/card";
import { mustFindDeckById, type DeckId } from "@/entities/deck";
import { downloadDeckCsv } from "../../lib/deckCsv";

export function exportDeck(id: DeckId): void {
  const deck = mustFindDeckById(id);
  downloadDeckCsv(deck, findCardsByDeckId(id));
}
