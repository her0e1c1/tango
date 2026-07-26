/** @file Parses, normalizes, and validates every Deck CSV import source. */

import * as Papa from "papaparse";

import { cardRawFromCsvColumns, cardRawSchema } from "@/domain/cardInput";
import type { DeckImportAnalysis, DeckImportIssue, DeckImportRow } from "@/domain/deckImport";

const rowContext = (columns: string[]) => JSON.stringify(columns);

/** Carries row-level diagnostics when an import entry point requires entirely valid CSV. */
export class DeckImportValidationError extends Error {
  readonly analysis: DeckImportAnalysis;

  constructor(analysis: DeckImportAnalysis) {
    const firstIssue = analysis.issues[0];
    const detail = firstIssue == null ? "The CSV file has no valid rows." : firstIssue.message;
    super(`Deck CSV validation failed: ${detail}`);
    this.name = "DeckImportValidationError";
    this.analysis = analysis;
  }
}

const parseCsvSource = (content: string | File): Promise<Papa.ParseResult<string[]>> =>
  new Promise((resolve, reject) => {
    const options: Papa.ParseConfig<string[]> = { delimiter: ",", complete: resolve, error: reject };
    if (typeof content === "string") Papa.parse<string[]>(content, options);
    else Papa.parse<string[]>(content, options);
  });

/**
 * Parses a string or File with the same row, normalization, required-field, and duplicate-key
 * rules used by upload, URL import, re-import, and legacy action callers.
 */
export const parseDeckImportCsv = async (content: string | File): Promise<DeckImportAnalysis> => {
  const parsed = await parseCsvSource(content);
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

    const card = cardRawFromCsvColumns(columns);
    const validation = cardRawSchema.safeParse(card);
    if (!validation.success) {
      invalidRows.add(rowNumber);
      for (const issue of validation.error.issues) {
        issues.push({ rowNumber, message: issue.message, context: rowContext(columns) });
      }
      return;
    }
    if (uniqueKeys.has(validation.data.uniqueKey)) {
      invalidRows.add(rowNumber);
      issues.push({
        rowNumber,
        message: `uniqueKey "${validation.data.uniqueKey}" is duplicated in this file.`,
        context: rowContext(columns),
      });
      return;
    }

    uniqueKeys.add(validation.data.uniqueKey);
    rows.push({ rowNumber, card: validation.data });
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

/** Returns valid rows or throws one diagnostic-rich error shared by non-preview import paths. */
export const requireValidDeckImportRows = (analysis: DeckImportAnalysis): DeckImportRow[] => {
  if (analysis.invalidCount > 0 || analysis.rows.length === 0) throw new DeckImportValidationError(analysis);
  return analysis.rows;
};
