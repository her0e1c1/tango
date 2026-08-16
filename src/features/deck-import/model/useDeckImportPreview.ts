import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";

import { useEffect, useRef, useState } from "react";

import { fetchCards, generateCardId } from "@/entities/card";
import { fetchDecks } from "@/entities/deck";
import { type DeckImportAnalysis, parseCsv } from "../lib/cardCsv";
import type { DeckImportStorageMode, PreparedDeckImport } from "./deckImportExecution";
import { prepareDeckImport } from "./deckImportExecution";
import type { DeckImportOperationScope } from "./useDeckImportOperation";

export interface DeckImportPreview {
  deckName: string;
  analysis: DeckImportAnalysis;
  plan: PreparedDeckImport["plan"];
}

interface DeckImportPreviewState {
  uid: string;
  storageMode: DeckImportStorageMode;
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

const initialState = (uid: string): DeckImportPreviewState => ({
  uid,
  storageMode: "remote",
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
  const [state, setState] = useState<DeckImportPreviewState>(() => initialState(uid));

  if (state.uid !== uid) setState(initialState(uid));
  const currentState = state.uid === uid ? state : initialState(uid);
  const updateState = (update: Partial<Omit<DeckImportPreviewState, "uid">>) => {
    setState((current) => ({ ...(current.uid === uid ? current : initialState(uid)), ...update }));
  };

  useEffect(() => {
    preparedImportRef.current.preparedImport = undefined;
  }, [uid]);

  const selectFile = async (file: File, { isCurrent }: DeckImportOperationScope) => {
    const { storageMode } = currentState;
    preparedImportRef.current.preparedImport = undefined;
    updateState({ preview: undefined, error: null });

    const assertCurrent = () => {
      if (!isCurrent()) throw new Error("Deck import user changed before the preview could finish");
    };

    try {
      const analysis = await parseCsv(await file.text());
      assertCurrent();
      const destinationData = await loadDestinationData(storageMode, uid, { decks, cards });
      assertCurrent();

      const preparedImport = prepareDeckImport(
        { name: file.name, rows: analysis.rows, storageMode },
        { uid, ...destinationData, generateCardId }
      );
      const preview = { deckName: file.name, analysis, plan: preparedImport.plan };
      preparedImportRef.current.preparedImport = preparedImport;
      updateState({ preview });
      return preview;
    } catch (caughtError) {
      if (isCurrent()) updateState({ error: caughtError });
      throw caughtError;
    }
  };

  const setStorageMode = (storageMode: DeckImportStorageMode) => {
    if (currentState.storageMode === storageMode) return false;

    preparedImportRef.current.preparedImport = undefined;
    updateState({ storageMode, preview: undefined, error: null });
    return true;
  };

  const takePreparedImport = () => {
    const { preview } = currentState;
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
    storageMode: currentState.storageMode,
    preview: currentState.preview,
    error: currentState.error,
  };
};
