import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";

import * as Papa from "papaparse";

import { downloadTextFile } from "@/shared/files";

const CSV_MIME_TYPE = "text/plain;charset=utf-8";

const cardToCsvRow = (card: Card): string[] => [card.frontText, card.backText, card.tags.join(","), card.uniqueKey];

export const downloadDeckCsv = (deck: Deck, cards: Card[]): void => {
  const csv = Papa.unparse(cards.map(cardToCsvRow), { escapeFormulae: true });
  const fileName = deck.name.endsWith(".csv") ? deck.name : `${deck.name}.csv`;
  downloadTextFile(csv, fileName, CSV_MIME_TYPE);
};
