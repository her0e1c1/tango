import { getCardContentValidationErrors, type CardRaw } from "@/entities/card";

import * as Papa from "papaparse";

export interface DeckImportRow {
  rowNumber: number;
  card: CardRaw;
}

export type CsvDiagnostic =
  | { kind: "card"; field: keyof CardRaw; reason: "required" | "invalid" }
  | { kind: "duplicate"; uniqueKey: string }
  | { kind: "columns"; count: number }
  | { kind: "parser"; type: string; code: string }
  | { kind: "empty" };

export interface DeckImportAnalysis {
  rows: DeckImportRow[];
  skippedRows: number[];
  issues: { rowNumber?: number; diagnostic: CsvDiagnostic; context?: string }[];
  invalidCount: number;
}

const fromRow = (row: string[]): CardRaw => ({
  frontText: row[0] ?? "",
  backText: row[1] ?? "",
  tags: [
    ...new Set(
      (row[2] ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    ),
  ],
  uniqueKey: (row[3] ?? "").trim(),
});

const rowContext = (columns: string[]) => JSON.stringify(columns);

const validateCard = (columns: string[], rowNumber: number, uniqueKeys: Set<string>) => {
  const card = fromRow(columns);
  const context = rowContext(columns);
  const validationErrors = getCardContentValidationErrors(card);
  const issues: DeckImportAnalysis["issues"] = Object.values(validationErrors).map((error) => ({
    rowNumber,
    diagnostic: { kind: "card", ...error },
    context,
  }));

  const uniqueKeyIsValid = validationErrors.uniqueKey === undefined;
  if (uniqueKeyIsValid && uniqueKeys.has(card.uniqueKey)) {
    issues.push({ rowNumber, diagnostic: { kind: "duplicate", uniqueKey: card.uniqueKey }, context });
  } else if (uniqueKeyIsValid) {
    uniqueKeys.add(card.uniqueKey);
  }
  return { card, issues };
};

export const parseCsv = async (content: string): Promise<DeckImportAnalysis> => {
  if (typeof content !== "string") throw new TypeError("CSV content must be a string");

  const parsed = await new Promise<Papa.ParseResult<string[]>>((resolve, reject) => {
    Papa.parse<string[]>(content, { delimiter: ",", complete: resolve, error: reject });
  });
  const rows: DeckImportRow[] = [];
  const skippedRows: number[] = [];
  const issues: DeckImportAnalysis["issues"] = [];
  const invalidRows = new Set<number>();
  const uniqueKeys = new Set<string>();

  parsed.errors.forEach((error) => {
    if (error.row == null) {
      issues.push({ diagnostic: { kind: "parser", type: error.type, code: error.code } });
      return;
    }
    const rowNumber = error.row + 1;
    invalidRows.add(rowNumber);
    issues.push({
      rowNumber,
      diagnostic: { kind: "parser", type: error.type, code: error.code },
      context: rowContext(parsed.data[error.row] ?? []),
    });
  });

  parsed.data.forEach((columns, index) => {
    const rowNumber = index + 1;
    if (invalidRows.has(rowNumber)) return;
    if (columns.every((column) => column.trim() === "")) {
      skippedRows.push(rowNumber);
      return;
    }
    if (columns.length !== 4) {
      invalidRows.add(rowNumber);
      issues.push({
        rowNumber,
        diagnostic: { kind: "columns", count: columns.length },
        context: rowContext(columns),
      });
      return;
    }

    const { card, issues: rowIssues } = validateCard(columns, rowNumber, uniqueKeys);

    if (rowIssues.length > 0) {
      invalidRows.add(rowNumber);
      issues.push(...rowIssues);
    } else {
      rows.push({ rowNumber, card });
    }
  });

  if (rows.length === 0 && issues.length === 0) {
    issues.push({ diagnostic: { kind: "empty" } });
  }

  const fileIssueCount = issues.filter((issue) => issue.rowNumber === undefined).length;
  return { rows, skippedRows, issues, invalidCount: invalidRows.size + fileIssueCount };
};
