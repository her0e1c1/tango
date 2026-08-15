import type { Card } from "@/entities/card";
import type { Deck, DeckCreateInput } from "@/entities/deck";

import { useEffect, useRef, useState } from "react";

import { fetchCards, mutateCards } from "@/entities/card";
import { fetchDecks } from "@/entities/deck";
import { useAuthUid } from "@/entities/auth";
import { parseCsv } from "../lib/cardCsv";
import type {
  DeckImportAttempt,
  DeckImportExecutionDependencies,
  DeckImportRequest,
} from "../model/deckImportExecution";
import { executePreparedDeckImport, partialResultFrom, prepareDeckImport } from "../model/deckImportExecution";
import type { DeckImportPreview, DeckImportResult } from "../model/deckImportTypes";
import { prepareSampleDeck } from "../model/sampleDeck";

export interface DeckImportOptions {
  cards: Card[];
  createDeck: (uid: string, deck: DeckCreateInput) => Promise<unknown>;
  decks: Deck[];
  generateCardId: () => string;
}

interface DeckImportSession {
  uid: string;
  running: boolean;
  previewAttempt: DeckImportAttempt | undefined;
  retryAttempt: DeckImportAttempt | undefined;
}

interface DeckImportState {
  uid: string;
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
  previewAttempt: undefined,
  retryAttempt: undefined,
});

const initialState = (uid: string): DeckImportState => ({
  uid,
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
  const executionDependencies: DeckImportExecutionDependencies = {
    uid,
    createDeck: (deck) => createDeck(uid, deck),
    mutateCards: (mutations) => mutateCards(uid, mutations),
  };

  const run = async (attempt: DeckImportAttempt, target: DeckImportSession) => {
    startSession(target);
    // Retries reuse the prepared IDs and only retain mutations that still failed.
    target.retryAttempt = attempt;
    publish(target, { pending: true, error: null });
    try {
      if (!isCurrent(target)) throw new Error("Deck import user changed before the import could start");
      const result = await executePreparedDeckImport(attempt, executionDependencies);
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
    const attempt = target.retryAttempt;
    if (attempt != null && !target.running) void run(attempt, target).catch(() => undefined);
  };

  const selectFile = async (file: File) => {
    const target = sessionRef.current;
    if (target.uid !== uid || !isCurrent(target)) {
      throw new Error("Deck import user changed before the preview could start");
    }
    if (target.running) throw new Error("A Deck import is already running");
    target.previewAttempt = undefined;
    target.retryAttempt = undefined;
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
      // Listener-backed stores can lag, so file imports are planned from authoritative server reads.
      const [remoteDecks, remoteCards] = await Promise.all([fetchDecks(uid), fetchCards(uid)]);
      if (!isCurrent(target)) throw new Error("Deck import user changed before the preview could finish");
      const request = { name: file.name, rows: analysis.rows } satisfies DeckImportRequest;
      const attempt = prepareDeckImport(request, {
        uid,
        decks: remoteDecks,
        cards: remoteCards,
        generateCardId,
      });
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

  const { preview, previewError, validating, pending, error, data } = currentState;

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

  return {
    selectFile,
    importPreview,
    addSample: () => run(prepareSampleDeck(uid, { cards, decks, generateCardId }), sessionRef.current),
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
