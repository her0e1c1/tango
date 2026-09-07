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
interface DeckImportPreview {
  deckName: string;
  analysis: DeckImportAnalysis;
}

export type DeckImportSourceState =
  | { kind: "empty" }
  | { kind: "error"; error: unknown }
  | { kind: "selected"; preview: DeckImportPreview; preparedImport: PreparedDeckImport | undefined };
