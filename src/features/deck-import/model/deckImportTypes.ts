import type { CardRaw } from "@/entities/card";
import type { DeckId } from "@/entities/deck";

export type DeckImportStorageMode = "local" | "remote";

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

export interface DeckImportPlanRow extends DeckImportRow {
  action: "create" | "update" | "unchanged";
}

export interface DeckImportPlan {
  rows: DeckImportPlanRow[];
  created: number;
  updated: number;
  unchanged: number;
}

export interface DeckImportPreview {
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
