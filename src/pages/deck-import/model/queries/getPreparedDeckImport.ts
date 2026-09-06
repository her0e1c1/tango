import type { DeckImportPreviewState, PreparedDeckImport } from "../types";

export const getPreparedDeckImport = (
  preview: DeckImportPreviewState["preview"],
  prepared: PreparedDeckImport | undefined
): PreparedDeckImport => {
  if (preview == null) throw new Error("Select a CSV file before importing");
  if (preview.analysis.invalidCount > 0) throw new Error("Fix invalid CSV rows before importing");
  if (preview.analysis.rows.length === 0) throw new Error("The CSV file has no valid rows");
  if (prepared === undefined) throw new Error("The prepared Deck import is not available");
  return prepared;
};
