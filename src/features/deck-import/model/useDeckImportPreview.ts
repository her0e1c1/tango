import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";

import { useEffect, useRef, useState } from "react";

import { fetchCards, generateCardId } from "@/entities/card";
import { fetchDecks } from "@/entities/deck";
import { type DeckImportAnalysis, parseCsv } from "../lib/cardCsv";
import type { DeckImportResult, DeckImportStorageMode, PreparedDeckImport } from "./deckImportExecution";
import { prepareDeckImport } from "./deckImportExecution";
import type { DeckImportOperation } from "./useDeckImportOperation";

export interface DeckImportPreview {
  deckName: string;
  analysis: DeckImportAnalysis;
  plan: PreparedDeckImport["plan"];
}

interface DeckImportPreviewState {
  uid: string;
  storageMode: DeckImportStorageMode;
  preview: DeckImportPreview | undefined;
  previewError: unknown;
}

interface PreparedDeckImportState {
  preparedImport: PreparedDeckImport | undefined;
}

interface UseDeckImportPreviewOptions {
  uid: string;
  decks: Deck[];
  cards: Card[];
  operation: DeckImportOperation;
  run: (preparedImport: PreparedDeckImport) => Promise<DeckImportResult>;
  clearExecution: () => void;
}

const initialState = (uid: string): DeckImportPreviewState => ({
  uid,
  storageMode: "remote",
  preview: undefined,
  previewError: null,
});
const createPreparedImportState = (): PreparedDeckImportState => ({ preparedImport: undefined });

const loadDestinationData = async (
  storageMode: DeckImportStorageMode,
  uid: string,
  localData: { decks: Deck[]; cards: Card[] }
): Promise<{ decks: Deck[]; cards: Card[] }> => {
  if (storageMode === "local") return localData;

  // Listener-backed stores may lag, so remote plans must use authoritative server reads.
  const [decks, cards] = await Promise.all([fetchDecks(uid), fetchCards(uid)]);
  return { decks, cards };
};

export const useDeckImportPreview = ({
  uid,
  decks,
  cards,
  operation,
  run,
  clearExecution,
}: UseDeckImportPreviewOptions) => {
  const preparedImportRef = useRef<PreparedDeckImportState>(createPreparedImportState());
  const [state, setState] = useState<DeckImportPreviewState>(() => initialState(uid));

  if (state.uid !== uid) setState(initialState(uid));
  const currentState = state.uid === uid ? state : initialState(uid);
  const updateState = (update: Partial<Omit<DeckImportPreviewState, "uid">>) => {
    setState((current) => ({ ...(current.uid === uid ? current : initialState(uid)), ...update }));
  };

  useEffect(() => {
    preparedImportRef.current.preparedImport = undefined;
  }, [uid]);

  const clearPreviewError = () => updateState({ previewError: null });

  const setStorageMode = (storageMode: DeckImportStorageMode) => {
    if (operation.isRunning() || currentState.storageMode === storageMode) return;

    preparedImportRef.current.preparedImport = undefined;
    clearExecution();
    updateState({ storageMode, preview: undefined, previewError: null });
  };

  const selectFile = async (file: File) => {
    const generation = operation.start("validating");
    const { storageMode } = currentState;
    preparedImportRef.current.preparedImport = undefined;
    clearExecution();
    updateState({ preview: undefined, previewError: null });

    try {
      const analysis = await parseCsv(await file.text());
      operation.assertCurrent(generation);

      const destinationData = await loadDestinationData(storageMode, uid, { decks, cards });
      operation.assertCurrent(generation);

      const preparedImport = prepareDeckImport(
        { name: file.name, rows: analysis.rows, storageMode },
        { uid, ...destinationData, generateCardId }
      );
      const preview = { deckName: file.name, analysis, plan: preparedImport.plan };
      preparedImportRef.current.preparedImport = preparedImport;
      updateState({ preview });
      return preview;
    } catch (caughtError) {
      if (operation.isCurrent(generation)) updateState({ previewError: caughtError });
      throw caughtError;
    } finally {
      operation.finish(generation);
    }
  };

  const importPreview = () => {
    if (operation.isRunning()) return Promise.reject(new Error("A Deck import is already running"));
    if (currentState.preview == null) return Promise.reject(new Error("Select a CSV file before importing"));
    if (currentState.preview.analysis.invalidCount > 0) {
      return Promise.reject(new Error("Fix invalid CSV rows before importing"));
    }
    if (currentState.preview.analysis.rows.length === 0) {
      return Promise.reject(new Error("The CSV file has no valid rows"));
    }
    if (preparedImportRef.current.preparedImport == null) {
      return Promise.reject(new Error("The prepared Deck import is not available"));
    }

    const { preparedImport } = preparedImportRef.current;
    preparedImportRef.current.preparedImport = undefined;
    clearPreviewError();
    return run(preparedImport);
  };

  return {
    selectFile,
    setStorageMode,
    importPreview,
    clearPreviewError,
    storageMode: currentState.storageMode,
    preview: currentState.preview,
    previewError: currentState.previewError,
  };
};
