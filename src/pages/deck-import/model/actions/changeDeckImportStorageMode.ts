import { getAuthUid } from "@/entities/auth";

import { deckImportStore, type DeckImportStorageMode } from "../store";

export function changeDeckImportStorageMode(storageMode: DeckImportStorageMode): void {
  if (storageMode === "remote" && getAuthUid() === "") return;
  const state = deckImportStore.getState();
  if (state.status !== "idle" || state.storageMode === storageMode) return;
  deckImportStore.setState({ storageMode, source: { kind: "empty" } });
}
