import type { Dispatch, RefObject, SetStateAction } from "react";
import { generateCardId } from "@/entities/card";
import { generateDeckId } from "@/entities/deck";
import type { ToastId } from "@/shared/ui/toast";
import { parseCsv } from "../../lib/cardCsv";
import type { DeckImportPreviewState, DeckImportStatus, DeckImportStorageMode, PreparedDeckImport } from "../types";
import { dismissImportError } from "./dismissImportError";
import { prepareDeckImport } from "./prepareDeckImport";

export const selectDeckImportFile = async (
  file: File,
  {
    uid,
    storageMode,
    preparedImportRef,
    setPreviewState,
    setStatus,
    errorToastId,
    isMounted,
  }: {
    uid: string;
    storageMode: DeckImportStorageMode;
    preparedImportRef: RefObject<PreparedDeckImport | undefined>;
    setPreviewState: Dispatch<SetStateAction<DeckImportPreviewState>>;
    setStatus: (status: DeckImportStatus) => void;
    errorToastId: RefObject<ToastId | undefined>;
    isMounted: () => boolean;
  }
): Promise<void> => {
  dismissImportError(errorToastId);
  setStatus("validating");
  preparedImportRef.current = undefined;
  setPreviewState({ storageMode, error: null });
  try {
    const analysis = await parseCsv(await file.text());
    // File reads can finish after navigation; preview and identities belong to the initiating route.
    if (!isMounted()) return;
    preparedImportRef.current = prepareDeckImport(
      { name: file.name, rows: analysis.rows, storageMode },
      { uid, generateDeckId, generateCardId }
    );
    setPreviewState((current) => ({ ...current, preview: { deckName: file.name, analysis } }));
  } catch (error) {
    if (isMounted()) setPreviewState((current) => ({ ...current, error }));
  } finally {
    if (isMounted()) setStatus("idle");
  }
};
