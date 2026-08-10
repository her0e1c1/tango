import * as FileSaver from "file-saver";
import * as Papa from "papaparse";

import { fromRow, isEmpty, toRow, type Card, type CardRaw } from "@/entities/card";
import type { Deck } from "@/entities/deck";

import { CSV_SAMPLE_TEXT } from "./sampleCsv";

const saveAs = (content: string, name: string) => {
  const fileName = name.endsWith(".csv") ? name : `${name}.csv`;
  FileSaver.saveAs(new Blob([content], { type: "text/plain;charset=utf-8" }), fileName);
};

export const downloadDeckData = (deck: Deck, cards: Card[]) => {
  saveAs(Papa.unparse(cards.map(toRow), { escapeFormulae: true }), deck.name);
};

export const downloadCsvSample = () => saveAs(CSV_SAMPLE_TEXT, "sample.csv");

export const parseCardCsv = async (content: unknown): Promise<CardRaw[]> => {
  if (typeof content !== "string" && !(typeof File !== "undefined" && content instanceof File)) {
    throw new TypeError("CSV content must be a string or File");
  }
  return await new Promise((resolve) =>
    Papa.parse(content, {
      complete: (results: { data: string[][] }) => resolve(results.data.map(fromRow).filter((card) => !isEmpty(card))),
    })
  );
};
