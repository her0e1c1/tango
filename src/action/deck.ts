/**
 * @file Implements application-level Deck operations.
 * The functions turn user intent into domain data or coordinated authentication work without
 * depending on React components.
 */

// import moment from "moment";
import { saveAs } from "file-saver";
import * as Papa from "papaparse";

import * as C from "@/constant";
import * as action from "@/action";

/**
 * Creates a complete deck from raw input, defaults, and generated identifiers.
 * The returned domain object is ready to validate, display, or persist without extra setup from
 * the caller.
 */
export const prepare = (deck: DeckRaw, uid: string, generateId: () => string): Deck => {
  return {
    ...deck,
    uid,
    id: generateId(),
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    scoreMax: null,
    scoreMin: null,
    isPublic: false,
    selectedTags: [],
    tagAndFilter: false,
    convertToBr: false,
    category: "",
  };
};

/**
 * Prepares and downloads data for the user.
 * Browser file handling remains behind this function so domain preparation can be understood
 * separately.
 */
export const downloadData = (deck: Deck, cards: Card[]) => {
  const csv = Papa.unparse(cards.map(action.card.toRow));
  _saveAs(csv, deck.name);
};

/**
 * Prepares and downloads as for the user.
 * Browser file handling remains behind this function so domain preparation can be understood
 * separately.
 */
export const _saveAs = (content: string, name: string) => {
  if (!name.endsWith(".csv")) {
    name += ".csv";
  }
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, name);
};

/**
 * Prepares and downloads csv sample text for the user.
 * Browser file handling remains behind this function so domain preparation can be understood
 * separately.
 */
export const downloadCsvSampleText = () => {
  _saveAs(C.CSV_SAMPLE_TEXT, "sample.csv");
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
        const cards = results.data.map(action.card.fromRow).filter((c) => !action.card.isEmpty(c));
        resolve(cards);
      },
    })
  );
};
