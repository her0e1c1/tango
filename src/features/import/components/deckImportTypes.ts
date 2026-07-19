export interface DeckImportRow {
  rowNumber: number;
  card: CardRaw;
}

export interface DeckImportIssue {
  rowNumber?: number;
  message: string;
  context?: string;
}

export interface DeckImportAnalysis {
  rows: DeckImportRow[];
  skippedRows: number[];
  issues: DeckImportIssue[];
  invalidCount: number;
}

export type DeckImportAction = "create" | "update" | "unchanged";

export interface DeckImportPlanRow extends DeckImportRow {
  action: DeckImportAction;
}

export interface DeckImportPlan {
  rows: DeckImportPlanRow[];
  created: number;
  updated: number;
  unchanged: number;
}

export interface DeckImportPreview {
  fileName: string;
  deckName: string;
  analysis: DeckImportAnalysis;
  plan: DeckImportPlan;
}

export interface DeckImportResult {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  deckId: DeckId;
}
