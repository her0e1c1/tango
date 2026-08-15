import type { Card } from "@/entities/card";
import type { Deck, DeckCreateInput } from "@/entities/deck";

import { useEffect, useRef, useState } from "react";

import { fetchCards, filterCardsByDeckId, mutateCards } from "@/entities/card";
import { fetchDecks } from "@/entities/deck";
import { useAuthUid } from "@/entities/auth";
import type { DeckImportPreview, DeckImportResult } from "../model/deckImportTypes";
import { parseCsv } from "../lib/cardCsv";
import type { DeckImportDependencies, DeckImportRequest } from "../model/deckImportExecution";
import { executePreparedDeckImport, partialResultFrom, prepareDeckImport } from "../model/deckImportExecution";

export interface DeckImportOptions {
  cards: Card[];
  createDeck: (uid: string, deck: DeckCreateInput) => Promise<unknown>;
  decks: Deck[];
  generateCardId: () => string;
}

interface DeckImportSession {
  uid: string;
  running: boolean;
  lastRequest: DeckImportRequest | undefined;
  preparedRequest: DeckImportRequest | undefined;
}

interface DeckImportState {
  uid: string;
  running: boolean;
  validating: boolean;
  preview: DeckImportPreview | undefined;
  previewError: unknown;
  error: unknown;
  data: DeckImportResult | undefined;
}

const createSession = (uid: string): DeckImportSession => ({
  uid,
  running: false,
  lastRequest: undefined,
  preparedRequest: undefined,
});

const initialState = (uid: string): DeckImportState => ({
  uid,
  running: false,
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
  // Reset during rendering so results from the previous identity are never exposed for an extra frame.
  const currentState = state.uid === uid ? state : initialState(uid);
  if (state.uid !== uid) setState(currentState);
  useEffect(() => {
    if (sessionRef.current.uid !== uid) sessionRef.current = createSession(uid);
  }, [uid]);
  // Object identity rejects stale work even across an A-to-B-to-A user transition where the UID matches again.
  const isCurrent = (session: DeckImportSession) => sessionRef.current === session;
  const updateState = (session: DeckImportSession, update: Partial<Omit<DeckImportState, "uid">>) => {
    if (!isCurrent(session)) return;
    setState((current) => {
      if (current.uid !== session.uid) return current;
      return { ...current, ...update };
    });
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

  const run = async (request: DeckImportRequest, session: DeckImportSession) => {
    if (session.uid !== uid || !isCurrent(session)) {
      throw new Error("Deck import user changed before the import could start");
    }
    if (session.running) throw new Error("A Deck import is already running");
    session.running = true;
    session.lastRequest = request;
    updateState(session, { running: true, error: null });
    try {
      const attempt = await prepareDeckImport(request, dependencies);
      if (!isCurrent(session)) throw new Error("Deck import user changed before the import could start");
      const result = await executePreparedDeckImport(attempt, dependencies);
      updateState(session, { data: result });
      return result;
    } catch (error) {
      updateState(session, { data: undefined, error });
      throw error;
    } finally {
      if (isCurrent(session)) {
        session.running = false;
        updateState(session, { running: false });
      }
    }
  };

  const retry = () => {
    const session = sessionRef.current;
    const request = session.lastRequest;
    if (request != null && !session.running) void run(request, session).catch(() => undefined);
  };

  const selectFile = async (file: File) => {
    const session = sessionRef.current;
    if (session.uid !== uid) throw new Error("Deck import user changed before the preview could start");
    if (session.running) throw new Error("A Deck import is already running");
    session.lastRequest = undefined;
    session.preparedRequest = undefined;
    updateState(session, {
      validating: true,
      preview: undefined,
      previewError: null,
      error: null,
      data: undefined,
    });
    try {
      const analysis = await parseCsv(await file.text());
      if (!isCurrent(session)) throw new Error("Deck import user changed before the preview could finish");
      const request = { kind: "content", name: file.name, rows: analysis.rows } satisfies DeckImportRequest;
      const attempt = await prepareDeckImport(request, dependencies);
      if (!isCurrent(session)) throw new Error("Deck import user changed before the preview could finish");
      const preview = {
        fileName: file.name,
        deckName: file.name,
        analysis,
        plan: attempt.plan,
      };
      session.preparedRequest = request;
      updateState(session, { preview });
      return preview;
    } catch (previewError) {
      updateState(session, { previewError });
      throw previewError;
    } finally {
      updateState(session, { validating: false });
    }
  };

  const { preview, previewError, validating, running, error, data } = currentState;

  const importPreview = () => {
    const session = sessionRef.current;
    if (session.running) return Promise.reject(new Error("A Deck import is already running"));
    if (preview == null) return Promise.reject(new Error("Select a CSV file before importing"));
    if (preview.analysis.invalidCount > 0) {
      return Promise.reject(new Error("Fix invalid CSV rows before importing"));
    }
    if (preview.analysis.rows.length === 0) {
      return Promise.reject(new Error("The CSV file has no valid rows"));
    }
    const request = session.preparedRequest;
    if (request == null) return Promise.reject(new Error("The prepared Deck import is not available"));
    return run(request, session);
  };

  const importUrl = async (url: string, name?: string) => {
    const session = sessionRef.current;
    const response = await fetch(new URL(url));
    if (!response.ok) throw new Error(`Unable to fetch Deck CSV (${response.status})`);
    const analysis = await parseCsv(await response.text());
    if (!isCurrent(session)) throw new Error("Deck import user changed before the import could start");
    if (analysis.invalidCount > 0) throw new Error("Fix invalid CSV rows before importing");
    if (analysis.rows.length === 0) throw new Error("The CSV file has no valid rows");
    return await run(
      {
        kind: "content",
        name: name ?? url.split("/").pop() ?? "no name",
        rows: analysis.rows,
      },
      session
    );
  };

  return {
    selectFile,
    importPreview,
    addSample: () => run({ kind: "sample" }, sessionRef.current),
    importUrl,
    reimport: (deck: Deck) => {
      if (deck.url == null || deck.url === "") return Promise.reject(new Error("Deck has no import URL"));
      return importUrl(deck.url, deck.name);
    },
    preview,
    validating,
    pending: running,
    error,
    previewError,
    data,
    partialResult: partialResultFrom(error),
    retry,
  };
};
