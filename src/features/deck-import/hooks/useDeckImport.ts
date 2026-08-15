/**
 * @file Provides the import feature's Use Deck Import React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import type { Card, CardCreateInput, CardEdit } from "@/entities/card";
import type { Deck, DeckCreateInput, DeckId } from "@/entities/deck";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchCards, filterCardsByDeckId } from "@/entities/card";
import { fetchDecks } from "@/entities/deck";
import { useAuthUid } from "@/entities/auth";
import type { DeckImportPreview, DeckImportResult } from "../model/deckImportTypes";
import { parseCsv } from "../lib/cardCsv";
import { buildDeckImportPlan } from "../lib/deckImportAnalysis";
import { upsertImportedCards } from "../api/upsertImportedCards";
import type { DeckImportDependencies, DeckImportRequest } from "../model/deckImportExecution";
import { executeDeckImport, partialResultFrom } from "../model/deckImportExecution";

export interface DeckImportOptions {
  cards: Card[];
  createCard: (uid: string, card: CardCreateInput) => Promise<unknown>;
  createDeck: (uid: string, deck: DeckCreateInput) => Promise<unknown>;
  decks: Deck[];
  editCard: (uid: string, card: CardEdit) => Promise<unknown>;
  generateCardId: () => string;
}

interface DeckImportState {
  uid: string;
  running: boolean;
  validating: boolean;
  preview: DeckImportPreview | undefined;
  error: unknown;
  data: DeckImportResult | undefined;
}

const initialDeckImportState = (uid: string): DeckImportState => ({
  uid,
  running: false,
  validating: false,
  preview: undefined,
  error: null,
  data: undefined,
});

interface ImportRunDependencies {
  runningRef: { current: boolean };
  setRunning: (running: boolean) => void;
  lastRequest: { current: DeckImportRequest | undefined };
  mutateAsync: (request: DeckImportRequest) => Promise<DeckImportResult>;
  generation: number;
  currentGeneration: { current: number };
}

/**
 * Runs the deck import workflow for the import feature.
 * The sequence and its cleanup remain together so partial failures can be handled consistently.
 */
const runDeckImport = async (
  request: DeckImportRequest,
  { runningRef, setRunning, lastRequest, mutateAsync, generation, currentGeneration }: ImportRunDependencies
) => {
  if (runningRef.current) throw new Error("A Deck import is already running");
  runningRef.current = true;
  setRunning(true);
  lastRequest.current = request;
  try {
    return await mutateAsync(request);
  } finally {
    if (currentGeneration.current === generation) {
      runningRef.current = false;
      setRunning(false);
    }
  }
};

interface FilePreviewDependencies {
  runningRef: { current: boolean };
  setValidating: (validating: boolean) => void;
  setPreview: (preview: DeckImportPreview | undefined) => void;
  reset: () => void;
  decks: Deck[];
  cardsByDeckId: (id: DeckId) => Card[];
  uid: string;
  currentUid: { current: string };
  generation: number;
  currentGeneration: { current: number };
}

/**
 * Parses a selected CSV file and builds the preview shown before import.
 * Existing cards are included in the plan so users can see which rows will be created, updated, or
 * skipped.
 */
const previewDeckImportFile = async (
  file: File,
  {
    runningRef,
    setValidating,
    setPreview,
    reset,
    decks,
    cardsByDeckId,
    uid,
    currentUid,
    generation,
    currentGeneration,
  }: FilePreviewDependencies
) => {
  const isCurrent = () => currentGeneration.current === generation && currentUid.current === uid;
  if (runningRef.current) throw new Error("A Deck import is already running");
  setValidating(true);
  setPreview(undefined);
  reset();
  try {
    const analysis = await parseCsv(await file.text());
    if (!isCurrent()) throw new Error("Deck import user changed before the preview could finish");
    const deck = decks.find((candidate) => candidate.name === file.name);
    const existing = deck == null ? [] : cardsByDeckId(deck.id);
    const next = {
      fileName: file.name,
      deckName: file.name,
      analysis,
      plan: buildDeckImportPlan(analysis.rows, existing),
    };
    setPreview(next);
    return next;
  } finally {
    if (isCurrent()) setValidating(false);
  }
};

/**
 * Provides the deck import values and operations needed by React components.
 * Callers receive one focused interface without coordinating the import feature's stores and
 * services themselves.
 */
export const useDeckImport = ({
  cards,
  createCard,
  createDeck,
  decks,
  editCard,
  generateCardId,
}: DeckImportOptions) => {
  const uid = useAuthUid();
  const cardsByDeckId = useCallback((deckId: DeckId) => filterCardsByDeckId(cards, deckId), [cards]);
  const generation = useRef(0);
  const generationUid = useRef(uid);
  const runningRef = useRef(false);
  const [state, setState] = useState(() => initialDeckImportState(uid));
  const currentState = state.uid === uid ? state : initialDeckImportState(uid);
  if (state.uid !== uid) setState(currentState);
  const lastRequest = useRef<DeckImportRequest>(undefined);
  const dependenciesRef = useRef<DeckImportDependencies>(undefined);
  const runRef = useRef<(request: DeckImportRequest) => Promise<DeckImportResult>>(undefined);
  const [retry] = useState(() => () => {
    const request = lastRequest.current;
    const currentRun = runRef.current;
    // biome-ignore lint/suspicious/noUnnecessaryConditions: React refs are mutable; remove after biomejs/biome#11174.
    if (request != null && currentRun != null && !runningRef.current) void currentRun(request).catch(() => undefined);
  });
  useEffect(() => {
    if (generationUid.current === uid) return;
    generationUid.current = uid;
    generation.current += 1;
    runningRef.current = false;
    lastRequest.current = undefined;
  }, [uid]);
  useEffect(() => {
    dependenciesRef.current = {
      uid,
      decks,
      cardsByDeckId,
      createDeck: (deck) => createDeck(uid, deck),
      generateCardId,
      bulkUpsert: (cards, createdIds) => upsertImportedCards(uid, cards, createdIds, { createCard, editCard }),
      fetchDecks,
      fetchCards,
    };
  }, [cardsByDeckId, createCard, createDeck, decks, editCard, generateCardId, uid]);
  const updateState = (update: Partial<Omit<DeckImportState, "uid">>) => {
    setState((current) => ({
      ...(current.uid === uid ? current : initialDeckImportState(uid)),
      ...update,
    }));
  };
  const setRunning = (running: boolean) => updateState({ running });
  const setValidating = (validating: boolean) => updateState({ validating });
  const setPreview = (preview: DeckImportPreview | undefined) => updateState({ preview });
  const setError = (error: unknown) => updateState({ error });

  const mutateAsync = async (request: DeckImportRequest) => {
    const operationGeneration = generation.current;
    setError(null);
    try {
      const dependencies = dependenciesRef.current;
      // biome-ignore lint/suspicious/noUnnecessaryConditions: React refs are mutable; remove after biomejs/biome#11174.
      if (dependencies == null) throw new Error("Deck import dependencies are not available");
      const result = await executeDeckImport(request, dependencies);
      if (generation.current === operationGeneration) updateState({ data: result });
      return result;
    } catch (nextError) {
      if (generation.current === operationGeneration) {
        updateState({ data: undefined, error: nextError });
      }
      throw nextError;
    }
  };

  const resetOperation = () => {
    lastRequest.current = undefined;
    updateState({ data: undefined, error: null });
  };

  /**
   * Runs the current import feature operation and returns its result.
   * Progress and failure cleanup stay in one place so callers observe a consistent workflow state.
   */
  const run = (request: DeckImportRequest) =>
    runDeckImport(request, {
      runningRef,
      setRunning,
      lastRequest,
      mutateAsync,
      generation: generation.current,
      currentGeneration: generation,
    });
  useEffect(() => {
    runRef.current = run;
  });

  const { preview, validating, running, error, data } = currentState;

  /**
   * Validates the selected CSV file and stores its import preview.
   * No remote data is changed until the user confirms that preview.
   */
  const selectFile = (file: File) =>
    previewDeckImportFile(file, {
      runningRef,
      setValidating,
      setPreview,
      reset: resetOperation,
      decks,
      cardsByDeckId,
      uid,
      currentUid: generationUid,
      generation: generation.current,
      currentGeneration: generation,
    });

  /**
   * Imports the currently validated preview after checking that it contains usable rows.
   * Concurrent imports and previews with validation errors are rejected before any remote mutation
   * starts.
   */
  const importPreview = () => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: React refs are mutable; remove after biomejs/biome#11174.
    if (runningRef.current) return Promise.reject(new Error("A Deck import is already running"));
    if (preview == null) return Promise.reject(new Error("Select a CSV file before importing"));
    if (preview.analysis.invalidCount > 0) {
      return Promise.reject(new Error("Fix invalid CSV rows before importing"));
    }
    if (preview.analysis.rows.length === 0) {
      return Promise.reject(new Error("The CSV file has no valid rows"));
    }
    return run({ kind: "content", name: preview.deckName, rows: preview.analysis.rows });
  };

  /** Downloads card CSV data from a public URL and runs it through the normal import workflow. */
  const importUrl = async (url: string, name?: string) => {
    const operationGeneration = generation.current;
    const operationUid = uid;
    const parsedUrl = new URL(url);
    const response = await fetch(parsedUrl);
    if (!response.ok) throw new Error(`Unable to fetch Deck CSV (${response.status})`);
    const analysis = await parseCsv(await response.text());
    if (generation.current !== operationGeneration || dependenciesRef.current?.uid !== operationUid) {
      throw new Error("Deck import user changed before the import could start");
    }
    if (analysis.invalidCount > 0) throw new Error("Fix invalid CSV rows before importing");
    if (analysis.rows.length === 0) throw new Error("The CSV file has no valid rows");
    return await run({
      kind: "content",
      name: name ?? url.split("/").pop() ?? "no name",
      rows: analysis.rows,
    });
  };

  return {
    selectFile,
    importPreview,
    addSample: () => run({ kind: "sample" }),
    importUrl,
    reimport: (deck: Deck) => {
      if (deck.url == null || deck.url === "") return Promise.reject(new Error("Deck has no import URL"));
      return importUrl(deck.url, deck.name);
    },
    preview,
    validating,
    pending: running,
    error,
    data,
    partialResult: partialResultFrom(error),
    retry,
  };
};
