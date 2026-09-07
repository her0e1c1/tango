import type { DeckImportState } from "../store";

export function getDeckImportView(state: DeckImportState) {
  return {
    storageMode: state.storageMode,
    preview: state.source.kind === "selected" ? state.source.preview : undefined,
    previewError: state.source.kind === "error" ? state.source.error : undefined,
    validating: state.status === "validating",
    pending: state.status === "importing",
    addingSample: state.status === "adding-sample",
  };
}
