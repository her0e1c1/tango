import { useRef, useState } from "react";

import { generateCardId } from "@/entities/card";
import { generateDeckId } from "@/entities/deck";
import { type DeckImportAnalysis, parseCsv } from "../lib/cardCsv";
import type { DeckImportStorageMode, PreparedDeckImport } from "./useDeckImportExecution";
import { prepareDeckImport } from "./useDeckImportExecution";

interface DeckImportPreviewState {
  storageMode: DeckImportStorageMode;
  preview?: {
    deckName: string;
    analysis: DeckImportAnalysis;
  };
  error: unknown;
}

const initialState = (): DeckImportPreviewState => ({
  storageMode: "remote",
  error: null,
});

export const useDeckImportPreview = (uid: string) => {
  const preparedImportRef = useRef<PreparedDeckImport | undefined>(undefined);
  const [state, setState] = useState<DeckImportPreviewState>(initialState);
  const updateState = (update: Partial<DeckImportPreviewState>) => {
    setState((current) => ({ ...current, ...update }));
  };

  const selectFile = async (file: File) => {
    const { storageMode } = state;
    preparedImportRef.current = undefined;
    setState({ storageMode, error: null });

    try {
      const analysis = await parseCsv(await file.text());
      const preparedImport = prepareDeckImport(
        { name: file.name, rows: analysis.rows, storageMode },
        { uid, generateDeckId, generateCardId }
      );
      const preview = { deckName: file.name, analysis };
      preparedImportRef.current = preparedImport;
      updateState({ preview });
    } catch (caughtError) {
      updateState({ error: caughtError });
    }
  };

  const setStorageMode = (storageMode: DeckImportStorageMode) => {
    if (state.storageMode === storageMode) return false;

    preparedImportRef.current = undefined;
    setState({ storageMode, error: null });
    return true;
  };

  const getPreparedImport = () => {
    const { preview } = state;
    if (preview == null) throw new Error("Select a CSV file before importing");
    if (preview.analysis.invalidCount > 0) throw new Error("Fix invalid CSV rows before importing");
    if (preview.analysis.rows.length === 0) throw new Error("The CSV file has no valid rows");
    const preparedImport = preparedImportRef.current;
    if (preparedImport === undefined) {
      throw new Error("The prepared Deck import is not available");
    }

    return preparedImport;
  };

  return {
    selectFile,
    setStorageMode,
    getPreparedImport,
    completePreparedImport: () => {
      preparedImportRef.current = undefined;
    },
    clearError: () => updateState({ error: null }),
    storageMode: state.storageMode,
    preview: state.preview,
    error: state.error,
  };
};
