import type { Card } from "@/entities/card";
import type { Deck, DeckCreateInput, LocalDeckCreateInput } from "@/entities/deck";

import { useEffect, useRef, useState } from "react";

import { fetchCards, filterCardsByDeckId, mutateCards } from "@/entities/card";
import { fetchDecks } from "@/entities/deck";
import { useAuthUid } from "@/entities/auth";
import { parseCsv } from "../lib/cardCsv";
import type { DeckImportAttempt, DeckImportDependencies, DeckImportRequest } from "../model/deckImportExecution";
import { executePreparedDeckImport, partialResultFrom, prepareDeckImport } from "../model/deckImportExecution";
import type { DeckImportPreview, DeckImportResult, DeckImportStorageMode } from "../model/deckImportTypes";

export interface DeckImportOptions {
  cards: Card[];
  createDeck: (uid: string, deck: DeckCreateInput | LocalDeckCreateInput) => Promise<unknown>;
  decks: Deck[];
  generateCardId: () => string;
}

interface DeckImportSession {
  uid: string;
  running: boolean;
  storageMode: DeckImportStorageMode;
  previewAttempt: DeckImportAttempt | undefined;
  retryInput: DeckImportInput | undefined;
}

type DeckImportInput = DeckImportRequest | DeckImportAttempt;

interface DeckImportState {
  uid: string;
  storageMode: DeckImportStorageMode;
  pending: boolean;
  validating: boolean;
  preview: DeckImportPreview | undefined;
  previewError: unknown;
  error: unknown;
  data: DeckImportResult | undefined;
}

const createSession = (uid: string): DeckImportSession => ({
  uid,
  running: false,
  storageMode: "remote",
  previewAttempt: undefined,
  retryInput: undefined,
});

const initialState = (uid: string): DeckImportState => ({
  uid,
  storageMode: "remote",
  pending: false,
  validating: false,
  preview: undefined,
  previewError: null,
  error: null,
  data: undefined,
});

export const useDeckImport = ({ cards, createDeck, decks, generateCardId }: DeckImportOptions) => {
  const uid = useAuthUid();
  const sessionRef = useRef(createSession(uid));
  const [state, setState] = useState(() => initialState(uid));
  const currentState = state.uid === uid ? state : initialState(uid);
  useEffect(() => {
    if (sessionRef.current.uid === uid) return;
    sessionRef.current = createSession(uid);
    setState(initialState(uid));
  }, [uid]);
  // Object identity rejects stale work even across an A-to-B-to-A user transition where the UID matches again.
  const isCurrent = (target: DeckImportSession) => sessionRef.current === target;
  const publish = (target: DeckImportSession, update: Partial<Omit<DeckImportState, "uid">>) => {
    if (!isCurrent(target)) return;
    setState((current) => (current.uid === target.uid ? { ...current, ...update } : current));
  };
  const startSession = (target: DeckImportSession) => {
    if (target.uid !== uid || !isCurrent(target)) {
      throw new Error("Deck import user changed before the import could start");
    }
    if (target.running) throw new Error("A Deck import is already running");
    target.running = true;
  };
  const dependencies: DeckImportDependencies = {
    uid,
    decks,
    cardsByDeckId: (deckId) => filterCardsByDeckId(cards, deckId),
    createDeck: (deck) => createDeck(uid, deck),
    generateCardId,
    mutateCards: (mutations) => mutateCards(uid, mutations),
    fetchDecks,
    fetchCards,
  };
  const prepareInput = (input: DeckImportInput) =>
    "kind" in input ? prepareDeckImport(input, dependencies) : Promise.resolve(input);

  const run = async (input: DeckImportInput, target: DeckImportSession) => {
    startSession(target);
    target.retryInput = input;
    publish(target, { pending: true, error: null });
    try {
      const attempt = await prepareInput(input);
      if (!isCurrent(target)) throw new Error("Deck import user changed before the import could start");
      // Once IDs and mutations are prepared, retries must reuse that exact attempt instead of replanning.
      target.retryInput = attempt;
      const result = await executePreparedDeckImport(attempt, dependencies);
      publish(target, { data: result });
      return result;
    } catch (importError) {
      publish(target, { data: undefined, error: importError });
      throw importError;
    } finally {
      if (isCurrent(target)) {
        target.running = false;
        publish(target, { pending: false });
      }
    }
  };

  const retry = () => {
    const target = sessionRef.current;
    const input = target.retryInput;
    if (input != null && !target.running) void run(input, target).catch(() => undefined);
  };

  const setStorageMode = (nextStorageMode: DeckImportStorageMode) => {
    const target = sessionRef.current;
    if (target.running || target.storageMode === nextStorageMode) return;
    // A prepared plan is destination-specific and must never execute after the user changes that destination.
    target.storageMode = nextStorageMode;
    target.previewAttempt = undefined;
    target.retryInput = undefined;
    publish(target, {
      storageMode: nextStorageMode,
      preview: undefined,
      previewError: null,
      error: null,
      data: undefined,
    });
  };

  const selectFile = async (file: File) => {
    const target = sessionRef.current;
    if (target.uid !== uid || !isCurrent(target)) {
      throw new Error("Deck import user changed before the preview could start");
    }
    if (target.running) throw new Error("A Deck import is already running");
    target.previewAttempt = undefined;
    target.retryInput = undefined;
    publish(target, {
      validating: true,
      preview: undefined,
      previewError: null,
      error: null,
      data: undefined,
    });
    try {
      const analysis = await parseCsv(await file.text());
      if (!isCurrent(target)) throw new Error("Deck import user changed before the preview could finish");
      const request = {
        kind: "content",
        name: file.name,
        rows: analysis.rows,
        storageMode: target.storageMode,
      } satisfies DeckImportRequest;
      const attempt = await prepareDeckImport(request, dependencies);
      if (!isCurrent(target)) throw new Error("Deck import user changed before the preview could finish");
      const preview = {
        fileName: file.name,
        deckName: file.name,
        analysis,
        plan: attempt.plan,
      };
      target.previewAttempt = attempt;
      publish(target, { preview });
      return preview;
    } catch (caughtPreviewError) {
      publish(target, { previewError: caughtPreviewError });
      throw caughtPreviewError;
    } finally {
      publish(target, { validating: false });
    }
  };

  const { storageMode, preview, previewError, validating, pending, error, data } = currentState;

  const importPreview = () => {
    const target = sessionRef.current;
    if (target.running) return Promise.reject(new Error("A Deck import is already running"));
    if (preview == null) return Promise.reject(new Error("Select a CSV file before importing"));
    if (preview.analysis.invalidCount > 0) {
      return Promise.reject(new Error("Fix invalid CSV rows before importing"));
    }
    if (preview.analysis.rows.length === 0) {
      return Promise.reject(new Error("The CSV file has no valid rows"));
    }
    if (target.previewAttempt == null) return Promise.reject(new Error("The prepared Deck import is not available"));
    return run(target.previewAttempt, target);
  };

  const importUrl = async (url: string, name?: string, requestedStorageMode = sessionRef.current.storageMode) => {
    const target = sessionRef.current;
    const response = await fetch(new URL(url));
    if (!response.ok) throw new Error(`Unable to fetch Deck CSV (${response.status})`);
    const analysis = await parseCsv(await response.text());
    if (!isCurrent(target)) throw new Error("Deck import user changed before the import could start");
    if (analysis.invalidCount > 0) throw new Error("Fix invalid CSV rows before importing");
    if (analysis.rows.length === 0) throw new Error("The CSV file has no valid rows");
    return await run(
      {
        kind: "content",
        name: name ?? url.split("/").pop() ?? "no name",
        rows: analysis.rows,
        storageMode: requestedStorageMode,
      },
      target
    );
  };

  return {
    selectFile,
    setStorageMode,
    importPreview,
    // The bundled sample keeps its stable per-user identity and existing account-synced behavior.
    addSample: () => run({ kind: "sample" }, sessionRef.current),
    importUrl,
    reimport: (deck: Deck) => {
      if (deck.url == null || deck.url === "") return Promise.reject(new Error("Deck has no import URL"));
      return importUrl(deck.url, deck.name, deck.localMode ? "local" : "remote");
    },
    storageMode,
    preview,
    validating,
    pending,
    error,
    previewError,
    data,
    partialResult: partialResultFrom(error),
    retry,
  };
};
