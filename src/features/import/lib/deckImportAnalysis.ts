import * as Papa from "papaparse";

import * as cardAction from "@/action/card";
import type {
  DeckImportAnalysis,
  DeckImportIssue,
  DeckImportPlan,
  DeckImportPlanRow,
  DeckImportRow,
} from "@/features/import/components/deckImportTypes";

const rowContext = (columns: string[]) => JSON.stringify(columns);

const sameCardContent = (left: CardRaw, right: CardRaw) =>
  left.frontText === right.frontText &&
  left.backText === right.backText &&
  left.tags.join("\0") === right.tags.join("\0");

export const parseDeckImportCsv = async (content: string | File): Promise<DeckImportAnalysis> => {
  const parsed = await new Promise<Papa.ParseResult<string[]>>((resolve, reject) => {
    Papa.parse<string[]>(content, { delimiter: ",", complete: resolve, error: reject });
  });
  const rows: DeckImportRow[] = [];
  const skippedRows: number[] = [];
  const issues: DeckImportIssue[] = [];
  const invalidRows = new Set<number>();
  const parseErrorRows = new Set<number>();
  const uniqueKeys = new Set<string>();
  let fileIssueCount = 0;

  parsed.errors.forEach((error) => {
    if (error.row == null) {
      fileIssueCount += 1;
      issues.push({ message: error.message });
      return;
    }
    const rowNumber = error.row + 1;
    invalidRows.add(rowNumber);
    parseErrorRows.add(error.row);
    issues.push({
      rowNumber,
      message: error.message,
      context: rowContext(parsed.data[error.row] ?? []),
    });
  });

  parsed.data.forEach((columns, index) => {
    const rowNumber = index + 1;
    if (parseErrorRows.has(index)) return;
    if (columns.every((column) => column.trim() === "")) {
      skippedRows.push(rowNumber);
      return;
    }
    if (columns.length !== 4) {
      invalidRows.add(rowNumber);
      issues.push({
        rowNumber,
        message: `Expected 4 columns, found ${columns.length}.`,
        context: rowContext(columns),
      });
      return;
    }

    const card = cardAction.fromRow(columns);
    card.uniqueKey = card.uniqueKey.trim();
    if (card.uniqueKey === "") {
      invalidRows.add(rowNumber);
      issues.push({ rowNumber, message: "uniqueKey is required.", context: rowContext(columns) });
      return;
    }
    if (uniqueKeys.has(card.uniqueKey)) {
      invalidRows.add(rowNumber);
      issues.push({
        rowNumber,
        message: `uniqueKey "${card.uniqueKey}" is duplicated in this file.`,
        context: rowContext(columns),
      });
      return;
    }

    uniqueKeys.add(card.uniqueKey);
    rows.push({ rowNumber, card });
  });

  if (rows.length === 0 && issues.length === 0) {
    fileIssueCount += 1;
    issues.push({ message: "The CSV file is empty." });
  }

  return {
    rows,
    skippedRows,
    issues,
    invalidCount: invalidRows.size + fileIssueCount,
  };
};

export const buildDeckImportPlan = (rows: DeckImportRow[], existingCards: Card[]): DeckImportPlan => {
  const existingByUniqueKey = new Map(existingCards.map((card) => [card.uniqueKey, card]));
  const plannedRows = rows.map((row): DeckImportPlanRow => {
    const existing = existingByUniqueKey.get(row.card.uniqueKey);
    const plannedAction = existing == null ? "create" : sameCardContent(existing, row.card) ? "unchanged" : "update";
    return { ...row, action: plannedAction };
  });

  return {
    rows: plannedRows,
    created: plannedRows.filter((row) => row.action === "create").length,
    updated: plannedRows.filter((row) => row.action === "update").length,
    unchanged: plannedRows.filter((row) => row.action === "unchanged").length,
  };
};
