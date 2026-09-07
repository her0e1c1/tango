import { changeStorageMode } from "../store";
import type { DeckImportStorageMode } from "../types";

export function changeDeckImportStorageMode(storageMode: DeckImportStorageMode): void {
  changeStorageMode(storageMode);
}
