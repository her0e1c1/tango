import type { CardRaw } from "@/entities/card";

import * as Papa from "papaparse";

export const isEmpty = (card: CardRaw): boolean => card.frontText === "" && card.backText === "";

export const fromRow = (row: string[]): CardRaw => ({
  frontText: row[0] || "",
  backText: row[1] || "",
  tags: typeof row[2] === "string" ? row[2].split(",") : [],
  uniqueKey: row[3] || "",
});

export const parseCsv = async (content: unknown): Promise<CardRaw[]> => {
  if (typeof content !== "string" && !(typeof File !== "undefined" && content instanceof File)) {
    throw new TypeError("CSV content must be a string or File");
  }
  return await new Promise((resolve) =>
    Papa.parse(content, {
      complete: (results: { data: string[][] }) => resolve(results.data.map(fromRow).filter((card) => !isEmpty(card))),
    })
  );
};
