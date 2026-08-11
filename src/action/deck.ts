/**
 * @file Implements application-level Deck operations.
 * The functions turn user intent into domain data or coordinated authentication work without
 * depending on React components.
 */

import type { Card, CardRaw } from "@/entities/card";
import type { Deck } from "@/entities/deck";

import * as Papa from "papaparse";

import * as cardAction from "@/action/card";
import { downloadTextFile } from "@/shared/files";

const CSV_MIME_TYPE = "text/plain;charset=utf-8";

/**
 * Prepares and downloads data for the user.
 * Browser file handling remains behind this function so domain preparation can be understood
 * separately.
 */
export const downloadData = (deck: Deck, cards: Card[]) => {
  const csv = Papa.unparse(cards.map(cardAction.toRow), { escapeFormulae: true });
  const fileName = deck.name.endsWith(".csv") ? deck.name : `${deck.name}.csv`;
  downloadTextFile(csv, fileName, CSV_MIME_TYPE);
};

/**
 * Parses csv into validated application data.
 * Malformed input is reported before downstream code relies on the result.
 */
export const parseCsv = async (content: unknown): Promise<CardRaw[]> => {
  if (typeof content !== "string" && !(typeof File !== "undefined" && content instanceof File)) {
    throw new TypeError("CSV content must be a string or File");
  }
  return await new Promise((resolve) =>
    Papa.parse(content, {
      complete: async (results: { data: string[][] }) => {
        const cards = results.data.map(cardAction.fromRow).filter((c) => !cardAction.isEmpty(c));
        resolve(cards);
      },
    })
  );
};
