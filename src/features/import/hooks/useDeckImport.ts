/**
 * @file Provides the import feature's Use Deck Import React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import type { Card, CardId, CardRaw } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";

import { useCallback, useEffect, useRef, useState } from "react";

import { createCard, generateCardId, selectCardsForDeck, useCards } from "@/entities/card";
import { createDeck, generateDeckId, useDecks } from "@/entities/deck";
import { useAuthSession } from "@/entities/auth-session";
import type { DeckImportPreview, DeckImportResult, DeckImportRow } from "../model/deckImportTypes";
import { parseCsv } from "../lib/cardCsv";
import { buildDeckImportPlan } from "../lib/deckImportAnalysis";
import sampleCards from "../../../../sample/build/output.json";
import { CardBulkMutationError, upsertImportedCards } from "../api/upsertImportedCards";

export interface DeckImportOptions {
  createDeck: (uid: string, deck: Deck) => Promise<unknown>;
}

interface DeckImportAttempt {
  uid: string;
  deck: Deck;
  createDeckPending: boolean;
  remainingUpserts: Card[];
  createdIds: CardId[];
  updatedIds: CardId[];
  totals: Pick<DeckImportResult, "created" | "updated" | "skipped">;
}

type ImportRequest =
  | { kind: "content"; name: string; rows: DeckImportRow[]; attempt?: DeckImportAttempt }
  | { kind: "sample"; attempt?: DeckImportAttempt };

const SAMPLE_DECK_NAME = "Sample Deck";
const SAMPLE_VERSION = 1;
const synchronizationError = () =>
  new Error("Deck import requires a synchronized connection. Check your connection and retry.");

/**
 * Builds the stable sample deck id used by the import feature.
 * Centralizing the format prevents different callers from producing incompatible identifiers.
 */
export const sampleDeckId = (uid: string): DeckId => `sample-v${SAMPLE_VERSION}-${uid}`;

/**
 * Converts imported card records into rows with human-readable row numbers.
 * The row numbers are later used to explain validation and import results to the user.
 */
const rowsFromCards = (cards: CardRaw[]): DeckImportRow[] =>
  cards.map((card, index) => ({ rowNumber: index + 1, card }));

/**
 * Reads a partial import result from an unknown error value when one is available.
 * The defensive shape checks let the UI show completed and failed row counts without trusting
 * arbitrary thrown data.
 */
const partialResultFrom = (error: unknown): DeckImportResult | undefined => {
  if (error == null || typeof error !== "object" || !("result" in error)) return undefined;
  const result = error.result;
  if (
    result == null ||
    typeof result !== "object" ||
    !("created" in result) ||
    !("updated" in result) ||
    !("skipped" in result) ||
    !("failed" in result) ||
    !("deckId" in result)
  ) {
    return undefined;
  }
  return result as DeckImportResult;
};

interface DeckImportDependencies {
  uid: string;
  synchronized: boolean;
  decks: Deck[];
  cardsByDeckId: (id: DeckId) => Card[];
  createDeck: (deck: Deck) => Promise<unknown>;
  bulkUpsert: (cards: Card[]) => Promise<unknown>;
}

type DeckImportPreparationDependencies = Pick<DeckImportDependencies, "uid" | "decks" | "cardsByDeckId">;

const prepareDeckImportAttempt = (
  request: ImportRequest,
  { uid, decks, cardsByDeckId }: DeckImportPreparationDependencies
): DeckImportAttempt => {
  const name = request.kind === "sample" ? SAMPLE_DECK_NAME : request.name;
  const preferredDeckId = request.kind === "sample" ? sampleDeckId(uid) : undefined;
  const rows = request.kind === "sample" ? rowsFromCards(sampleCards as CardRaw[]) : request.rows;
  let deck = decks.find((candidate) =>
    preferredDeckId === undefined ? candidate.name === name : candidate.id === preferredDeckId
  );
  const createDeckPending = deck == null;
  if (deck == null) {
    deck = createDeck({ name }, uid, generateDeckId);
    if (preferredDeckId !== undefined) deck = { ...deck, id: preferredDeckId };
  }

  const existing = cardsByDeckId(deck.id);
  const byUniqueKey = new Map(existing.map((card) => [card.uniqueKey, card]));
  const plan = buildDeckImportPlan(rows, existing);
  const remainingUpserts: Card[] = [];
  const createdIds: CardId[] = [];
  const updatedIds: CardId[] = [];
  plan.rows.forEach((row) => {
    const current = byUniqueKey.get(row.card.uniqueKey);
    if (row.action === "create") {
      const card = createCard(row.card, deck, generateCardId);
      remainingUpserts.push(card);
      createdIds.push(card.id);
    } else if (row.action === "update" && current != null) {
      remainingUpserts.push({ ...current, ...row.card });
      updatedIds.push(current.id);
    }
  });
  return {
    uid,
    deck,
    createDeckPending,
    remainingUpserts,
    createdIds,
    updatedIds,
    totals: { created: plan.created, updated: plan.updated, skipped: plan.unchanged },
  };
};

/**
 * Creates or finds the destination deck, plans row changes, and writes imported cards.
 * A bulk-write failure is converted into counts that distinguish successful, skipped, and failed
 * rows.
 */
const executeDeckImport = async (
  request: ImportRequest,
  { uid, synchronized, decks, cardsByDeckId, createDeck, bulkUpsert }: DeckImportDependencies
): Promise<DeckImportResult> => {
  if (uid === "") throw new Error("A confirmed user is required for imports");
  if (!synchronized) throw synchronizationError();
  let attempt = request.attempt;
  if (attempt == null || attempt.uid !== uid) {
    attempt = prepareDeckImportAttempt(request, { uid, decks, cardsByDeckId });
    request.attempt = attempt;
  }
  if (attempt.createDeckPending) {
    await createDeck(attempt.deck);
    attempt.createDeckPending = false;
  }
  const upserts = attempt.remainingUpserts;
  try {
    if (upserts.length > 0) await bulkUpsert(upserts);
  } catch (error) {
    const failedIds = error instanceof CardBulkMutationError ? error.failedIds : upserts.map((card) => card.id);
    const failed = new Set(failedIds);
    attempt.remainingUpserts = upserts.filter((card) => failed.has(card.id));
    throw Object.assign(new Error(`Deck import did not complete: ${String(error)}`), {
      result: {
        created: attempt.createdIds.filter((id) => !failed.has(id)).length,
        updated: attempt.updatedIds.filter((id) => !failed.has(id)).length,
        skipped: attempt.totals.skipped,
        failed: attempt.remainingUpserts.length,
        deckId: attempt.deck.id,
      },
    });
  }
  attempt.remainingUpserts = [];
  return {
    ...attempt.totals,
    failed: 0,
    deckId: attempt.deck.id,
  };
};

interface ImportRunDependencies {
  runningRef: { current: boolean };
  setRunning: (running: boolean) => void;
  lastRequest: { current: ImportRequest | undefined };
  mutateAsync: (request: ImportRequest) => Promise<DeckImportResult>;
  generation: number;
  currentGeneration: { current: number };
}

/**
 * Runs the deck import workflow for the import feature.
 * The sequence and its cleanup remain together so partial failures can be handled consistently.
 */
const runDeckImport = async (
  request: ImportRequest,
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
  setError: (error: unknown) => void;
  reset: () => void;
  synchronized: boolean;
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
    setError,
    reset,
    synchronized,
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
  if (!synchronized) {
    const error = synchronizationError();
    reset();
    setError(error);
    throw error;
  }
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
export const useDeckImport = ({ createDeck: createDeckUseCase }: DeckImportOptions) => {
  const auth = useAuthSession();
  const cardRemote = useCards();
  const deckRemote = useDecks();
  const cardsByDeckId = useCallback(
    (deckId: DeckId) => selectCardsForDeck(cardRemote.cards, deckId),
    [cardRemote.cards]
  );
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const generation = useRef(0);
  const generationUid = useRef(uid);
  const [stateUid, setStateUid] = useState(uid);
  const runningRef = useRef(false);
  const [runningState, setRunningState] = useState(() => ({ uid, value: false }));
  const [validatingState, setValidatingState] = useState(() => ({ uid, value: false }));
  const [previewState, setPreviewState] = useState<{
    uid: string;
    value: DeckImportPreview | undefined;
  }>(() => ({ uid, value: undefined }));
  const [errorState, setErrorState] = useState<{ uid: string; value: unknown }>(() => ({
    uid,
    value: null,
  }));
  const [dataState, setDataState] = useState<{ uid: string; value: DeckImportResult | undefined }>(() => ({
    uid,
    value: undefined,
  }));
  if (stateUid !== uid) {
    setStateUid(uid);
    setRunningState({ uid, value: false });
    setValidatingState({ uid, value: false });
    setPreviewState({ uid, value: undefined });
    setErrorState({ uid, value: null });
    setDataState({ uid, value: undefined });
  }
  const lastRequest = useRef<ImportRequest>(undefined);
  const dependenciesRef = useRef<DeckImportDependencies>(undefined);
  const runRef = useRef<(request: ImportRequest) => Promise<DeckImportResult>>(undefined);
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
      synchronized:
        cardRemote.status === "ready" &&
        cardRemote.syncStatus === "synced" &&
        deckRemote.status === "ready" &&
        deckRemote.syncStatus === "synced",
      decks: deckRemote.decks,
      cardsByDeckId,
      createDeck: (deck) => createDeckUseCase(uid, deck),
      bulkUpsert: (cards) => upsertImportedCards(uid, cards),
    };
  }, [
    cardRemote.status,
    cardRemote.syncStatus,
    cardsByDeckId,
    createDeckUseCase,
    deckRemote.decks,
    deckRemote.status,
    deckRemote.syncStatus,
    uid,
  ]);
  const setRunning = (value: boolean) => setRunningState({ uid, value });
  const setValidating = (value: boolean) => setValidatingState({ uid, value });
  const setPreview = (value: DeckImportPreview | undefined) => setPreviewState({ uid, value });
  const setError = (value: unknown) => setErrorState({ uid, value });
  const setData = (value: DeckImportResult | undefined) => setDataState({ uid, value });

  const mutateAsync = async (request: ImportRequest) => {
    const operationGeneration = generation.current;
    setError(null);
    try {
      const dependencies = dependenciesRef.current;
      // biome-ignore lint/suspicious/noUnnecessaryConditions: React refs are mutable; remove after biomejs/biome#11174.
      if (dependencies == null) throw new Error("Deck import dependencies are not available");
      const result = await executeDeckImport(request, dependencies);
      if (generation.current === operationGeneration) setData(result);
      return result;
    } catch (nextError) {
      if (generation.current === operationGeneration) {
        setData(undefined);
        setError(nextError);
      }
      throw nextError;
    }
  };

  const resetOperation = () => {
    lastRequest.current = undefined;
    setData(undefined);
    setError(null);
  };

  /**
   * Runs the current import feature operation and returns its result.
   * Progress and failure cleanup stay in one place so callers observe a consistent workflow state.
   */
  const run = (request: ImportRequest) =>
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

  const preview = previewState.uid === uid ? previewState.value : undefined;
  const validating = validatingState.uid === uid && validatingState.value;
  const running = runningState.uid === uid && runningState.value;
  const error = errorState.uid === uid ? errorState.value : null;
  const data = dataState.uid === uid ? dataState.value : undefined;

  /**
   * Validates the selected CSV file and stores its import preview.
   * No remote data is changed until the user confirms that preview.
   */
  const selectFile = (file: File) =>
    previewDeckImportFile(file, {
      runningRef,
      setValidating,
      setPreview,
      setError,
      reset: resetOperation,
      synchronized:
        cardRemote.status === "ready" &&
        cardRemote.syncStatus === "synced" &&
        deckRemote.status === "ready" &&
        deckRemote.syncStatus === "synced",
      decks: deckRemote.decks,
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
