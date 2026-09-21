import { createStore } from "zustand/vanilla";
import type { DeckImportAnalysis } from "../lib/cardCsv";
import type { PreparedDeckImport } from "./actions/executePreparedDeckImport";

type DeckImportStatus = "idle" | "validating" | "importing";
interface DeckImportPreview {
  deckName: string;
  analysis: DeckImportAnalysis;
}

type DeckImportSourceState =
  | { kind: "empty" }
  | { kind: "error"; error: unknown }
  | { kind: "selected"; preview: DeckImportPreview; preparedImport: PreparedDeckImport | undefined };

export interface DeckImportState {
  status: DeckImportStatus;
  source: DeckImportSourceState;
}

// Pending work and retry identities must survive leaving and re-entering the Page.
export const deckImportStore = createStore<DeckImportState>()(() => ({
  status: "idle",
  source: { kind: "empty" },
}));
