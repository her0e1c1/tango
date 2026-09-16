import { createStore } from "zustand/vanilla";
import type { DeckImportSourceState, DeckImportStatus, DeckImportStorageMode } from "./types";

export interface DeckImportState {
  storageMode: DeckImportStorageMode;
  status: DeckImportStatus;
  source: DeckImportSourceState;
}

// Pending work and retry identities must survive leaving and re-entering the Page.
export const deckImportStore = createStore<DeckImportState>()(() => ({
  storageMode: "remote",
  status: "idle",
  source: { kind: "empty" },
}));
