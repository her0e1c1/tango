import { useEffect, useRef, useState } from "react";

import { useAuthUid } from "@/entities/auth";
import { generateCardId, mutateCards, useCards } from "@/entities/card";
import { createDeck, useDecks } from "@/entities/deck";
import { type DeckImportAnalysis, parseCsv } from "../lib/cardCsv";
import type { DeckImportResult, DeckImportStorageMode } from "../model/deckImportExecution";
import { executePreparedDeckImport, prepareDeckImport } from "../model/deckImportExecution";
import { prepareSampleDeck } from "../model/sampleDeck";

type DeckImportAttempt = ReturnType<typeof prepareDeckImport>;

export interface DeckImportPreview {
  deckName: string;
  analysis: DeckImportAnalysis;
  plan: DeckImportAttempt["plan"];
}

type DeckImportStatus = "idle" | "validating" | "importing";

type DeckImportFailure = { stage: "preview"; error: unknown } | { stage: "import"; error: unknown };

interface DeckImportState {
  uid: string;
  storageMode: DeckImportStorageMode;
  status: DeckImportStatus;
  preview: DeckImportPreview | undefined;
  failure: DeckImportFailure | undefined;
  result: DeckImportResult | undefined;
}

interface DeckImportExecutionState {
  running: boolean;
  previewAttempt: DeckImportAttempt | undefined;
}

const initialState = (uid: string): DeckImportState => ({
  uid,
  storageMode: "remote",
  status: "idle",
  preview: undefined,
  failure: undefined,
  result: undefined,
});

const createExecutionState = (): DeckImportExecutionState => ({
  running: false,
  previewAttempt: undefined,
});

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

  const run = async (attempt: DeckImportAttempt) => {
    const execution = executionRef.current;
    if (execution.running) throw new Error("A Deck import is already running");

    const generation = generationRef.current;
    execution.running = true;
    updateState({ status: "importing", failure: undefined });

    try {
      const result = await executePreparedDeckImport(attempt, {
        uid,
        createDeck: (deck) => createDeck(uid, deck),
        mutateCards: (mutations) => mutateCards(uid, mutations),
      });
      if (isCurrent(generation)) updateState({ result });
      return result;
    } catch (caughtError) {
      if (isCurrent(generation)) {
        updateState({ result: undefined, failure: { stage: "import", error: caughtError } });
      }
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

    execution.previewAttempt = undefined;
    updateState({ storageMode, preview: undefined, failure: undefined, result: undefined });
  };

  const selectFile = async (file: File) => {
    const execution = executionRef.current;
    if (execution.running) throw new Error("A Deck import is already running");

    const generation = generationRef.current;
    const { storageMode } = currentState;
    execution.running = true;
    execution.previewAttempt = undefined;
    updateState({ status: "validating", preview: undefined, failure: undefined, result: undefined });

    try {
      const analysis = await parseCsv(await file.text());
      assertCurrent(generation);

      const attempt = prepareDeckImport(
        { name: file.name, rows: analysis.rows, storageMode },
        { uid, decks: [], cards: [], generateCardId }
      );
      const preview = {
        deckName: file.name,
        analysis,
        plan: attempt.plan,
      };
      execution.previewAttempt = attempt;
      updateState({ preview });
      return preview;
    } catch (caughtError) {
      if (isCurrent(generation)) updateState({ failure: { stage: "preview", error: caughtError } });
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
    if (execution.previewAttempt == null) {
      return Promise.reject(new Error("The prepared Deck import is not available"));
    }
    const attempt = execution.previewAttempt;
    execution.previewAttempt = undefined;
    return run(attempt);
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
    error: currentState.failure?.stage === "import" ? currentState.failure.error : null,
    previewError: currentState.failure?.stage === "preview" ? currentState.failure.error : null,
    result: currentState.result,
  };
};
