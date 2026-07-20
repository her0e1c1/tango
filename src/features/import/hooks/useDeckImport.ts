import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";

import * as action from "@/action";
import { documentMetadata as firestoreMetadata } from "@/adapters/firestore";
import { useAuth } from "@/auth/AuthContext";
import { useCardMutations } from "@/features/card/hooks/useCardMutations";
import { useDeckMutations } from "@/features/deck/hooks/useDeckMutations";
import { CardBulkMutationError } from "@/query/mutations/cardMutationService";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { useConfig } from "@/hooks/useConfig";
import type { DeckImportPreview, DeckImportResult, DeckImportRow } from "@/features/import/components/deckImportTypes";
import { buildDeckImportPlan, parseDeckImportCsv } from "@/features/import/lib/deckImportAnalysis";
import sampleCards from "../../../../sample/build/output.json";

type ImportRequest = { kind: "content"; name: string; rows: DeckImportRow[] } | { kind: "sample" };

const SAMPLE_DECK_NAME = "Sample Deck";
const SAMPLE_VERSION = 1;
export const sampleDeckId = (uid: string): DeckId => `sample-v${SAMPLE_VERSION}-${uid}`;

const rowsFromCards = (cards: CardRaw[]): DeckImportRow[] =>
  cards.map((card, index) => ({ rowNumber: index + 1, card }));

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
  decks: Deck[];
  cardsByDeckId: (id: DeckId) => Card[];
  createDeck: (deck: Deck) => Promise<unknown>;
  bulkUpsert: (cards: Card[]) => Promise<unknown>;
}

const executeDeckImport = async (
  request: ImportRequest,
  { uid, decks, cardsByDeckId, createDeck, bulkUpsert }: DeckImportDependencies
): Promise<DeckImportResult> => {
  if (uid === "") throw new Error("A confirmed user is required for imports");
  const name = request.kind === "sample" ? SAMPLE_DECK_NAME : request.name;
  const preferredDeckId = request.kind === "sample" ? sampleDeckId(uid) : undefined;
  const rows = request.kind === "sample" ? rowsFromCards(sampleCards as CardRaw[]) : request.rows;
  let deck = decks.find((candidate) =>
    preferredDeckId === undefined ? candidate.name === name : candidate.id === preferredDeckId
  );
  if (deck == null) {
    deck = action.deck.prepare({ name }, uid, firestoreMetadata.generateDeckId);
    if (preferredDeckId !== undefined) deck = { ...deck, id: preferredDeckId };
    await createDeck(deck);
  }

  const existing = cardsByDeckId(deck.id);
  const byUniqueKey = new Map(existing.map((card) => [card.uniqueKey, card]));
  const plan = buildDeckImportPlan(rows, existing);
  const upserts: Card[] = [];
  const createdIds = new Set<CardId>();
  const updatedIds = new Set<CardId>();
  plan.rows.forEach((row) => {
    const current = byUniqueKey.get(row.card.uniqueKey);
    if (row.action === "create") {
      const card = action.card.prepare(row.card, deck, firestoreMetadata.generateCardId);
      upserts.push(card);
      createdIds.add(card.id);
    } else if (row.action === "update" && current != null) {
      upserts.push({ ...current, ...row.card });
      updatedIds.add(current.id);
    }
  });
  try {
    if (upserts.length > 0) await bulkUpsert(upserts);
  } catch (error) {
    const failedIds = error instanceof CardBulkMutationError ? error.failedIds : upserts.map((card) => card.id);
    const failed = new Set(failedIds);
    throw Object.assign(new Error(`Deck import did not complete: ${String(error)}`), {
      result: {
        created: [...createdIds].filter((id) => !failed.has(id)).length,
        updated: [...updatedIds].filter((id) => !failed.has(id)).length,
        skipped: plan.unchanged,
        failed: failed.size,
        deckId: deck.id,
      },
    });
  }
  return {
    created: plan.created,
    updated: plan.updated,
    skipped: plan.unchanged,
    failed: 0,
    deckId: deck.id,
  };
};

interface ImportRunDependencies {
  runningRef: { current: boolean };
  setRunning: (running: boolean) => void;
  lastRequest: { current: ImportRequest | undefined };
  mutateAsync: (request: ImportRequest) => Promise<DeckImportResult>;
}

const runDeckImport = async (
  request: ImportRequest,
  { runningRef, setRunning, lastRequest, mutateAsync }: ImportRunDependencies
) => {
  if (runningRef.current) throw new Error("A Deck import is already running");
  runningRef.current = true;
  setRunning(true);
  lastRequest.current = request;
  try {
    return await mutateAsync(request);
  } finally {
    runningRef.current = false;
    setRunning(false);
  }
};

interface FilePreviewDependencies {
  runningRef: { current: boolean };
  setValidating: (validating: boolean) => void;
  setPreview: (preview: DeckImportPreview | undefined) => void;
  reset: () => void;
  decks: Deck[];
  cardsByDeckId: (id: DeckId) => Card[];
}

const previewDeckImportFile = async (
  file: File,
  { runningRef, setValidating, setPreview, reset, decks, cardsByDeckId }: FilePreviewDependencies
) => {
  if (runningRef.current) throw new Error("A Deck import is already running");
  setValidating(true);
  setPreview(undefined);
  reset();
  try {
    const analysis = await parseDeckImportCsv(file);
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
    setValidating(false);
  }
};

export const useDeckImport = () => {
  const auth = useAuth();
  const config = useConfig();
  const remote = useRemoteCollections();
  const deckMutations = useDeckMutations();
  const cardMutations = useCardMutations();
  const runningRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [validating, setValidating] = useState(false);
  const [preview, setPreview] = useState<DeckImportPreview>();
  const lastRequest = useRef<ImportRequest>(undefined);

  const operation = useMutation({
    retry: false,
    mutationFn: (request: ImportRequest) =>
      executeDeckImport(request, {
        uid: auth.status === "authenticated" ? auth.uid : "",
        decks: remote.decks,
        cardsByDeckId: remote.cardsByDeckId,
        createDeck: deckMutations.create,
        bulkUpsert: cardMutations.bulkUpsert,
      }),
  });

  const run = (request: ImportRequest) =>
    runDeckImport(request, {
      runningRef,
      setRunning,
      lastRequest,
      mutateAsync: operation.mutateAsync,
    });

  const selectFile = (file: File) =>
    previewDeckImportFile(file, {
      runningRef,
      setValidating,
      setPreview,
      reset: operation.reset,
      decks: remote.decks,
      cardsByDeckId: remote.cardsByDeckId,
    });

  const importPreview = () => {
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

  const importUrl = async (url: string, name?: string) => {
    const headers: Record<string, string> = {};
    if (config.githubAccessToken !== "") {
      headers.Accept = "application/vnd.github.raw";
      headers.Authorization = `Bearer ${config.githubAccessToken}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Unable to fetch Deck CSV (${response.status})`);
    const cards = await action.deck.parseCsv(await response.text());
    return await run({
      kind: "content",
      name: name ?? url.split("/").pop() ?? "no name",
      rows: rowsFromCards(cards),
    });
  };

  const retry = () => {
    const request = lastRequest.current;
    if (request != null && !runningRef.current) void run(request).catch(() => undefined);
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
    pending: operation.isPending || running,
    error: operation.error,
    data: operation.data,
    partialResult: partialResultFrom(operation.error),
    retry,
  };
};
