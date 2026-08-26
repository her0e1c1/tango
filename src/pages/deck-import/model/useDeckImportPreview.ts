import { useLayoutEffect, useRef, useState } from "react";

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

interface PreparedDeckImportState {
  preparedImport: PreparedDeckImport | undefined;
}

const initialState = (uid: string): DeckImportPreviewState => ({
  storageMode: uid === "" ? "local" : "remote",
  error: null,
});
const createPreparedImportState = (): PreparedDeckImportState => ({ preparedImport: undefined });

export const useDeckImportPreview = (uid: string) => {
  const preparedImportRef = useRef<PreparedDeckImportState>(createPreparedImportState());
  const operationRevisionRef = useRef(0);
  const previousUidRef = useRef(uid);
  const [state, setState] = useState<DeckImportPreviewState>(() => initialState(uid));
  const updateState = (update: Partial<DeckImportPreviewState>) => {
    setState((current) => ({ ...current, ...update }));
  };

  useLayoutEffect(() => {
    if (previousUidRef.current === uid) return;

    // A prepared remote import must never execute after account access changes.
    previousUidRef.current = uid;
    operationRevisionRef.current += 1;
    preparedImportRef.current.preparedImport = undefined;
    setState(initialState(uid));
  }, [uid]);

  const selectFile = async (file: File) => {
    operationRevisionRef.current += 1;
    const operationRevision = operationRevisionRef.current;
    const { storageMode } = state;
    preparedImportRef.current.preparedImport = undefined;
    setState({ storageMode, error: null });

    try {
      const analysis = await parseCsv(await file.text());
      if (operationRevisionRef.current !== operationRevision) return;
      const preparedImport = prepareDeckImport(
        { name: file.name, rows: analysis.rows, storageMode },
        { uid, generateDeckId, generateCardId }
      );
      const preview = { deckName: file.name, analysis };
      preparedImportRef.current.preparedImport = preparedImport;
      updateState({ preview });
    } catch (caughtError) {
      if (operationRevisionRef.current !== operationRevision) return;
      updateState({ error: caughtError });
    }
  };

  const setStorageMode = (storageMode: DeckImportStorageMode) => {
    if (storageMode === "remote" && uid === "") return false;
    if (state.storageMode === storageMode) return false;

    operationRevisionRef.current += 1;
    preparedImportRef.current.preparedImport = undefined;
    setState({ storageMode, error: null });
    return true;
  };

  const getPreparedImport = () => {
    const { preview } = state;
    if (preview == null) throw new Error("Select a CSV file before importing");
    if (preview.analysis.invalidCount > 0) throw new Error("Fix invalid CSV rows before importing");
    if (preview.analysis.rows.length === 0) throw new Error("The CSV file has no valid rows");
    if (preparedImportRef.current.preparedImport == null) {
      throw new Error("The prepared Deck import is not available");
    }

    return preparedImportRef.current.preparedImport;
  };

  return {
    selectFile,
    setStorageMode,
    getPreparedImport,
    completePreparedImport: () => {
      preparedImportRef.current.preparedImport = undefined;
    },
    clearError: () => updateState({ error: null }),
    storageMode: state.storageMode,
    preview: state.preview,
    error: state.error,
  };
};
