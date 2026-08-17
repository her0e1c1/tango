import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";

import { useRef, useState } from "react";

import { fetchCards, generateCardId } from "@/entities/card";
import { fetchDecks } from "@/entities/deck";
import { type DeckImportAnalysis, parseCsv } from "../lib/cardCsv";
import type { DeckImportStorageMode, PreparedDeckImport } from "./useDeckImportExecution";
import { prepareDeckImport } from "./useDeckImportExecution";

export interface DeckImportPreview {
  deckName: string;
  analysis: DeckImportAnalysis;
  plan: PreparedDeckImport["plan"];
}

interface DeckImportPreviewState {
  storageMode: DeckImportStorageMode;
  fileName: string | undefined;
  preview: DeckImportPreview | undefined;
  error: unknown;
}

interface PreparedDeckImportState {
  preparedImport: PreparedDeckImport | undefined;
}

interface UseDeckImportPreviewOptions {
  uid: string;
  decks: Deck[];
  cards: Card[];
}

const initialState = (): DeckImportPreviewState => ({
  storageMode: "remote",
  fileName: undefined,
  preview: undefined,
  error: null,
});
const createPreparedImportState = (): PreparedDeckImportState => ({ preparedImport: undefined });

const loadDestinationData = async (
  storageMode: DeckImportStorageMode,
  uid: string,
  localData: { decks: Deck[]; cards: Card[] }
) => {
  if (storageMode === "local") return localData;

  // Listener-backed stores may lag, so remote plans must use authoritative server reads.
  const [decks, cards] = await Promise.all([fetchDecks(uid), fetchCards(uid)]);
  return { decks, cards };
};

export const useDeckImportPreview = ({ uid, decks, cards }: UseDeckImportPreviewOptions) => {
  const preparedImportRef = useRef<PreparedDeckImportState>(createPreparedImportState());
  const [state, setState] = useState<DeckImportPreviewState>(initialState);
  const updateState = (update: Partial<DeckImportPreviewState>) => {
    setState((current) => ({ ...current, ...update }));
  };

  const selectFile = async (file: File) => {
    const { storageMode } = state;
    preparedImportRef.current.preparedImport = undefined;
    updateState({ fileName: file.name, preview: undefined, error: null });

    let analysis: DeckImportAnalysis;
    try {
      analysis = await parseCsv(await file.text());
    } catch (caughtError) {
      updateState({ error: caughtError });
      return;
    }

    let destinationData: { decks: Deck[]; cards: Card[] };
    try {
      destinationData = await loadDestinationData(storageMode, uid, { decks, cards });
    } catch (caughtError) {
      updateState({ error: caughtError });
      return;
    }

    if (storageMode === "remote" && uid === "") {
      updateState({ error: new Error("A confirmed user is required for remote imports") });
      return;
    }

    // Preparation runs outside the expected I/O failure boundaries so schema and programming invariants still reject.
    const preparedImport = prepareDeckImport(
      { name: file.name, rows: analysis.rows, storageMode },
      { uid, ...destinationData, generateCardId }
    );
    const preview = { deckName: file.name, analysis, plan: preparedImport.plan };
    preparedImportRef.current.preparedImport = preparedImport;
    updateState({ preview });
    return preview;
  };

  const setStorageMode = (storageMode: DeckImportStorageMode) => {
    if (state.storageMode === storageMode) return false;

    preparedImportRef.current.preparedImport = undefined;
    updateState({ storageMode, fileName: undefined, preview: undefined, error: null });
    return true;
  };

  const takePreparedImport = () => {
    const { preview } = state;
    const preconditionError =
      preview == null
        ? new Error("Select a CSV file before importing")
        : preview.analysis.invalidCount > 0
          ? new Error("Fix invalid CSV rows before importing")
          : preview.analysis.rows.length === 0
            ? new Error("The CSV file has no valid rows")
            : undefined;
    if (preconditionError !== undefined) {
      updateState({ error: preconditionError });
      return;
    }

    // A valid preview must always retain its one-shot prepared import until execution starts.
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
    invalidate: () => {
      preparedImportRef.current.preparedImport = undefined;
      updateState({ preview: undefined });
    },
    clearError: () => updateState({ error: null }),
    storageMode: state.storageMode,
    fileName: state.fileName,
    preview: state.preview,
    error: state.error,
  };
};
