import type { RefObject } from "react";
import type { ToastId } from "@/shared/ui/toast";
import type { DeckImportPreviewState, DeckImportStorageMode, PreparedDeckImport } from "../types";
import { dismissImportError } from "./dismissImportError";

export const changeDeckImportStorageMode = (
  storageMode: DeckImportStorageMode,
  {
    currentMode,
    preparedImportRef,
    setPreviewState,
    errorToastId,
  }: {
    currentMode: DeckImportStorageMode;
    preparedImportRef: RefObject<PreparedDeckImport | undefined>;
    setPreviewState: (state: DeckImportPreviewState) => void;
    errorToastId: RefObject<ToastId | undefined>;
  }
): void => {
  if (currentMode === storageMode) return;
  preparedImportRef.current = undefined;
  setPreviewState({ storageMode, error: null });
  dismissImportError(errorToastId);
};
