import { useRef, useState } from "react";

import { generateCardId } from "@/entities/card";
import { type DeckImportAnalysis, parseCsv } from "../lib/cardCsv";
import type { DeckImportStorageMode, PreparedDeckImport } from "./useDeckImportExecution";
import { prepareDeckImport } from "./useDeckImportExecution";

export interface DeckImportPreview {
  deckName: string;
  analysis: DeckImportAnalysis;
}

interface DeckImportPreviewState {
  storageMode: DeckImportStorageMode;
  preview: DeckImportPreview | undefined;
  error: unknown;
}

interface PreparedDeckImportState {
  preparedImport: PreparedDeckImport | undefined;
}

interface UseDeckImportPreviewOptions {
  uid: string;
}

const initialState = (): DeckImportPreviewState => ({
  storageMode: "remote",
  preview: undefined,
  error: null,
});
const createPreparedImportState = (): PreparedDeckImportState => ({ preparedImport: undefined });

export const useDeckImportPreview = ({ uid }: UseDeckImportPreviewOptions) => {
  const preparedImportRef = useRef<PreparedDeckImportState>(createPreparedImportState());
  const [state, setState] = useState<DeckImportPreviewState>(initialState);
  const updateState = (update: Partial<DeckImportPreviewState>) => {
    setState((current) => ({ ...current, ...update }));
  };

  const selectFile = async (file: File) => {
    const { storageMode } = state;
    preparedImportRef.current.preparedImport = undefined;
    updateState({ preview: undefined, error: null });

    try {
      const analysis = await parseCsv(await file.text());
      const preparedImport = prepareDeckImport(
        { name: file.name, rows: analysis.rows, storageMode },
        { uid, generateCardId }
      );
      const preview = { deckName: file.name, analysis };
      preparedImportRef.current.preparedImport = preparedImport;
      updateState({ preview });
      return preview;
    } catch (caughtError) {
      updateState({ error: caughtError });
      throw caughtError;
    }
  };

  const setStorageMode = (storageMode: DeckImportStorageMode) => {
    if (state.storageMode === storageMode) return false;

    preparedImportRef.current.preparedImport = undefined;
    updateState({ storageMode, preview: undefined, error: null });
    return true;
  };

  const takePreparedImport = () => {
    const { preview } = state;
    if (preview == null) throw new Error("Select a CSV file before importing");
    if (preview.analysis.invalidCount > 0) throw new Error("Fix invalid CSV rows before importing");
    if (preview.analysis.rows.length === 0) throw new Error("The CSV file has no valid rows");
    if (preparedImportRef.current.preparedImport == null) {
      throw new Error("The prepared Deck import is not available");
    }

    const { preparedImport } = preparedImportRef.current;
    preparedImportRef.current.preparedImport = undefined;
    return preparedImport;
  };

  return {
    selectFile,
    setStorageMode,
    takePreparedImport,
    clearError: () => updateState({ error: null }),
    storageMode: state.storageMode,
    preview: state.preview,
    error: state.error,
  };
};
