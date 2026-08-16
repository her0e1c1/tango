import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";

import { useEffect, useRef, useState } from "react";

import { useAuthUid } from "@/entities/auth";
import { fetchCards, generateCardId, mutateCards, useCards } from "@/entities/card";
import { createDeck, fetchDecks, useDecks } from "@/entities/deck";
import { parseCsv } from "../lib/cardCsv";
import type { DeckImportAttempt } from "../model/deckImportExecution";
import { executePreparedDeckImport, partialResultFrom, prepareDeckImport } from "../model/deckImportExecution";
import type { DeckImportPreview, DeckImportResult, DeckImportStorageMode } from "../model/deckImportTypes";
import { prepareSampleDeck } from "../model/sampleDeck";

type DeckImportStatus = "idle" | "validating" | "importing";

type DeckImportFailure = { stage: "preview"; error: unknown } | { stage: "import"; error: unknown };

interface DeckImportState {
  storageMode: DeckImportStorageMode;
  status: DeckImportStatus;
  preview: DeckImportPreview | undefined;
  failure: DeckImportFailure | undefined;
  result: DeckImportResult | undefined;
}

const INITIAL_STATE: DeckImportState = {
  storageMode: "remote",
  status: "idle",
  preview: undefined,
  failure: undefined,
  result: undefined,
};

export const useDeckImport = () => {
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();

  // The generation invalidates stale async work even when auth changes A-to-B-to-A.
  const generationRef = useRef(0);
  // Lock synchronously before React publishes status so operations cannot overlap in the same render.
  const busyRef = useRef(false);
  const previewAttemptRef = useRef<DeckImportAttempt | undefined>(undefined);
  const retryAttemptRef = useRef<DeckImportAttempt | undefined>(undefined);
  const [state, setState] = useState<DeckImportState>(INITIAL_STATE);

  const updateState = (update: Partial<DeckImportState>) => {
    setState((current) => ({ ...current, ...update }));
  };

  useEffect(() => {
    generationRef.current += 1;
    busyRef.current = false;
    previewAttemptRef.current = undefined;
    retryAttemptRef.current = undefined;
    setState(INITIAL_STATE);
  }, [uid]);

  const isCurrent = (generation: number) => generation === generationRef.current;

  const run = async (attempt: DeckImportAttempt) => {
    if (busyRef.current) throw new Error("A Deck import is already running");

    const generation = generationRef.current;
    busyRef.current = true;
    retryAttemptRef.current = attempt;
    updateState({ status: "importing", failure: undefined });

    try {
      const result = await executePreparedDeckImport(attempt, {
        uid,
        createDeck: (deck) => createDeck(uid, deck),
        mutateCards: (mutations) => mutateCards(uid, mutations),
      });
      if (isCurrent(generation)) updateState({ result });
      return result;
    } catch (error) {
      if (isCurrent(generation)) updateState({ result: undefined, failure: { stage: "import", error } });
      throw error;
    } finally {
      if (isCurrent(generation)) {
        busyRef.current = false;
        updateState({ status: "idle" });
      }
    }
  };

  const retry = () => {
    const attempt = retryAttemptRef.current;
    if (attempt != null && !busyRef.current) void run(attempt).catch(() => undefined);
  };

  const setStorageMode = (storageMode: DeckImportStorageMode) => {
    if (busyRef.current || state.storageMode === storageMode) return;

    previewAttemptRef.current = undefined;
    retryAttemptRef.current = undefined;
    updateState({ storageMode, preview: undefined, failure: undefined, result: undefined });
  };

  const selectFile = async (file: File) => {
    if (busyRef.current) throw new Error("A Deck import is already running");

    const generation = generationRef.current;
    const storageMode = state.storageMode;
    busyRef.current = true;
    previewAttemptRef.current = undefined;
    retryAttemptRef.current = undefined;
    updateState({ status: "validating", preview: undefined, failure: undefined, result: undefined });

    try {
      const analysis = await parseCsv(await file.text());
      if (!isCurrent(generation)) throw new Error("Deck import user changed before the preview could finish");

      // Listener-backed stores can lag, so remote file imports are planned from authoritative server reads.
      const [activeDecks, activeCards]: [Deck[], Card[]] =
        storageMode === "remote" ? await Promise.all([fetchDecks(uid), fetchCards(uid)]) : [decks, cards];

      if (!isCurrent(generation)) throw new Error("Deck import user changed before the preview could finish");

      const attempt = prepareDeckImport(
        { name: file.name, rows: analysis.rows, storageMode },
        { uid, decks: activeDecks, cards: activeCards, generateCardId }
      );
      const preview = {
        deckName: file.name,
        analysis,
        plan: attempt.plan,
      };
      previewAttemptRef.current = attempt;
      updateState({ preview });
      return preview;
    } catch (error) {
      if (isCurrent(generation)) updateState({ failure: { stage: "preview", error } });
      throw error;
    } finally {
      if (isCurrent(generation)) {
        busyRef.current = false;
        updateState({ status: "idle" });
      }
    }
  };

  const importPreview = () => {
    if (busyRef.current) return Promise.reject(new Error("A Deck import is already running"));
    if (state.preview == null) return Promise.reject(new Error("Select a CSV file before importing"));
    if (state.preview.analysis.invalidCount > 0) {
      return Promise.reject(new Error("Fix invalid CSV rows before importing"));
    }
    if (state.preview.analysis.rows.length === 0) {
      return Promise.reject(new Error("The CSV file has no valid rows"));
    }

    const attempt = previewAttemptRef.current;
    if (attempt == null) return Promise.reject(new Error("The prepared Deck import is not available"));
    return run(attempt);
  };

  const error = state.failure?.stage === "import" ? state.failure.error : null;

  return {
    selectFile,
    setStorageMode,
    importPreview,
    addSample: () => run(prepareSampleDeck(uid, { cards, decks, generateCardId })),
    storageMode: state.storageMode,
    preview: state.preview,
    validating: state.status === "validating",
    pending: state.status === "importing",
    error,
    previewError: state.failure?.stage === "preview" ? state.failure.error : null,
    result: state.result,
    partialResult: partialResultFrom(error),
    retry,
  };
};
