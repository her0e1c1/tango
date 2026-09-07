import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

import { deckImportStore, type DeckImportState } from "../store";

const selectDeckImportView = (state: DeckImportState) => ({
  storageMode: state.storageMode,
  preview: state.source.kind === "selected" ? state.source.preview : undefined,
  previewError: state.source.kind === "error" ? state.source.error : undefined,
  validating: state.status === "validating",
  pending: state.status === "importing",
  addingSample: state.status === "adding-sample",
});

export function useDeckImportState() {
  return useStore(deckImportStore, useShallow(selectDeckImportView));
}
