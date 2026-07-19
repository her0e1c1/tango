// import moment from "moment";
import { saveAs } from "file-saver";
import * as Papa from "papaparse";

import * as C from "@/constant";
import * as action from "@/action";

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

export const downloadData = (deck: Deck, cards: Card[]) => {
  const csv = Papa.unparse(cards.map(action.card.toRow));
  _saveAs(csv, deck.name);
};

export const _saveAs = (content: string, name: string) => {
  if (!name.endsWith(".csv")) {
    name += ".csv";
  }
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, name);
};

export const downloadCsvSampleText = () => {
  _saveAs(C.CSV_SAMPLE_TEXT, "sample.csv");
};

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
