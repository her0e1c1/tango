import { deckImportStore, type DeckImportStorageMode } from "../store";

export function changeDeckImportStorageMode(storageMode: DeckImportStorageMode): void {
  const state = deckImportStore.getState();
  if (state.status !== "idle" || state.storageMode === storageMode) return;
  deckImportStore.setState({ storageMode, source: { kind: "empty" } });
}
