// import moment from "moment";
import { saveAs } from "file-saver";
import * as Papa from "papaparse";

import * as C from "@/constant";
import * as action from "@/action";
import * as firestore from "@/action/firestore";

export const prepare = (deck: DeckRaw, config: DeckConfig): Deck => {
  const { uid, localMode } = config;
  return {
    ...deck,
    uid,
    localMode,
    id: firestore.mocked.generateDeckId(),
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

export const generateName = (deckName: string, state: DeckState): string => {
  const names = new Set(Object.values(state.byId).map((d) => d?.name));
  if (!names.has(deckName)) return deckName;
  let i = 1;
  for (;;) {
    const name = `${deckName}_${i}`;
    if (!names.has(name)) return name;
    i++;
  }
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
