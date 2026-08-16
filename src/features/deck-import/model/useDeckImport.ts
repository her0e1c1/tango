import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";

import { useEffect, useRef, useState } from "react";

import { useAuthUid } from "@/entities/auth";
import { fetchCards, generateCardId, mutateCards, useCards } from "@/entities/card";
import { createDeck, fetchDecks, useDecks } from "@/entities/deck";
import { type DeckImportAnalysis, parseCsv } from "../lib/cardCsv";
import type { DeckImportResult, DeckImportStorageMode, PreparedDeckImport } from "./deckImportExecution";
import { executePreparedDeckImport, prepareDeckImport } from "./deckImportExecution";
import { prepareSampleDeck } from "./sampleDeck";

export interface DeckImportPreview {
  deckName: string;
  analysis: DeckImportAnalysis;
  plan: PreparedDeckImport["plan"];
}

type DeckImportStatus = "idle" | "validating" | "importing";

interface DeckImportState {
  uid: string;
  storageMode: DeckImportStorageMode;
  status: DeckImportStatus;
  preview: DeckImportPreview | undefined;
  previewError: unknown;
  error: unknown;
  result: DeckImportResult | undefined;
}

interface DeckImportExecutionState {
  running: boolean;
  preparedImport: PreparedDeckImport | undefined;
}

const initialState = (uid: string): DeckImportState => ({
  uid,
  storageMode: "remote",
  status: "idle",
  preview: undefined,
  previewError: null,
  error: null,
  result: undefined,
});

const createExecutionState = (): DeckImportExecutionState => ({
  running: false,
  preparedImport: undefined,
});

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

export const useDeckImport = () => {
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();

  // The generation invalidates stale async work even when auth changes A-to-B-to-A.
  const generationRef = useRef(0);
  // Execution state must update synchronously so operations cannot overlap before React publishes status.
  const executionRef = useRef<DeckImportExecutionState>(createExecutionState());
  const [state, setState] = useState<DeckImportState>(() => initialState(uid));

  if (state.uid !== uid) setState(initialState(uid));
  const currentState = state.uid === uid ? state : initialState(uid);

  const updateState = (update: Partial<Omit<DeckImportState, "uid">>) => {
    setState((current) => ({ ...(current.uid === uid ? current : initialState(uid)), ...update }));
  };

  useEffect(() => {
    generationRef.current += 1;
    executionRef.current = createExecutionState();
  }, [uid]);

  const isCurrent = (generation: number) => generation === generationRef.current;
  const assertCurrent = (generation: number) => {
    if (!isCurrent(generation)) throw new Error("Deck import user changed before the preview could finish");
  };

  const run = async (preparedImport: PreparedDeckImport) => {
    const execution = executionRef.current;
    if (execution.running) throw new Error("A Deck import is already running");

    const generation = generationRef.current;
    execution.running = true;
    updateState({ status: "importing", previewError: null, error: null });

    try {
      const result = await executePreparedDeckImport(preparedImport, {
        uid,
        createDeck: (deck) => createDeck(uid, deck),
        mutateCards: (mutations) => mutateCards(uid, mutations),
      });
      if (isCurrent(generation)) updateState({ result });
      return result;
    } catch (caughtError) {
      if (isCurrent(generation)) updateState({ result: undefined, error: caughtError });
      throw caughtError;
    } finally {
      if (isCurrent(generation)) {
        execution.running = false;
        updateState({ status: "idle" });
      }
    }
  };

  const setStorageMode = (storageMode: DeckImportStorageMode) => {
    const execution = executionRef.current;
    if (execution.running || currentState.storageMode === storageMode) return;

    execution.preparedImport = undefined;
    updateState({ storageMode, preview: undefined, previewError: null, error: null, result: undefined });
  };

  const selectFile = async (file: File) => {
    const execution = executionRef.current;
    if (execution.running) throw new Error("A Deck import is already running");

    const generation = generationRef.current;
    const { storageMode } = currentState;
    execution.running = true;
    execution.preparedImport = undefined;
    updateState({
      status: "validating",
      preview: undefined,
      previewError: null,
      error: null,
      result: undefined,
    });

    try {
      const analysis = await parseCsv(await file.text());
      assertCurrent(generation);

      const destinationData = await loadDestinationData(storageMode, uid, { decks, cards });

      assertCurrent(generation);

      const preparedImport = prepareDeckImport(
        { name: file.name, rows: analysis.rows, storageMode },
        { uid, ...destinationData, generateCardId }
      );
      const preview = {
        deckName: file.name,
        analysis,
        plan: preparedImport.plan,
      };
      execution.preparedImport = preparedImport;
      updateState({ preview });
      return preview;
    } catch (caughtError) {
      if (isCurrent(generation)) updateState({ previewError: caughtError });
      throw caughtError;
    } finally {
      if (isCurrent(generation)) {
        execution.running = false;
        updateState({ status: "idle" });
      }
    }
  };

  const importPreview = () => {
    const execution = executionRef.current;
    if (execution.running) return Promise.reject(new Error("A Deck import is already running"));
    if (currentState.preview == null) return Promise.reject(new Error("Select a CSV file before importing"));
    if (currentState.preview.analysis.invalidCount > 0) {
      return Promise.reject(new Error("Fix invalid CSV rows before importing"));
    }
    if (currentState.preview.analysis.rows.length === 0) {
      return Promise.reject(new Error("The CSV file has no valid rows"));
    }
    if (execution.preparedImport == null) {
      return Promise.reject(new Error("The prepared Deck import is not available"));
    }
    const { preparedImport } = execution;
    execution.preparedImport = undefined;
    return run(preparedImport);
  };

  return {
    selectFile,
    setStorageMode,
    importPreview,
    addSample: () => run(prepareSampleDeck(uid, { cards, decks, generateCardId })),
    storageMode: currentState.storageMode,
    preview: currentState.preview,
    validating: currentState.status === "validating",
    pending: currentState.status === "importing",
    error: currentState.error,
    previewError: currentState.previewError,
    result: currentState.result,
  };
};
