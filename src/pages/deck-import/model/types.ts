import type { CardMutation } from "@/entities/card";
import type { LocalDeckCreateInput, RemoteDeckCreateInput } from "@/entities/deck";
import type { DeckImportAnalysis } from "../lib/cardCsv";
type DeckImportCreateInput = RemoteDeckCreateInput | LocalDeckCreateInput;
export type DeckImportStorageMode = "local" | "remote";

export interface PreparedDeckImport {
  uid: string;
  destination: DeckImportCreateInput;
  mutations: CardMutation[];
}

export interface DeckImportResult {
  created: number;
  deckId: string;
}
export type DeckImportStatus = "idle" | "validating" | "importing" | "adding-sample";
export interface DeckImportPreviewState {
  storageMode: DeckImportStorageMode;
  preview?: { deckName: string; analysis: DeckImportAnalysis };
  error: unknown;
}
