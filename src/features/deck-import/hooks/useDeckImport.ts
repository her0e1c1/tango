import type { Card } from "@/entities/card";
import type { Deck, DeckCreateInput } from "@/entities/deck";

import { useEffect, useReducer, useRef } from "react";

import { fetchCards, filterCardsByDeckId, mutateCards } from "@/entities/card";
import { fetchDecks } from "@/entities/deck";
import { useAuthUid } from "@/entities/auth";
import { parseCsv } from "../lib/cardCsv";
import type { DeckImportDependencies, DeckImportRequest } from "../model/deckImportExecution";
import { executePreparedDeckImport, partialResultFrom, prepareDeckImport } from "../model/deckImportExecution";
import type { DeckImportInput } from "../model/deckImportState";
import { deckImportReducer, initialDeckImportState } from "../model/deckImportState";

export interface DeckImportOptions {
  cards: Card[];
  createDeck: (uid: string, deck: DeckCreateInput) => Promise<unknown>;
  decks: Deck[];
  generateCardId: () => string;
}

interface DeckImportSession {
  uid: string;
  running: boolean;
}

const createSession = (uid: string): DeckImportSession => ({
  uid,
  running: false,
});

export const useDeckImport = ({ cards, createDeck, decks, generateCardId }: DeckImportOptions) => {
  const uid = useAuthUid();
  const sessionRef = useRef(createSession(uid));
  const [state, dispatch] = useReducer(deckImportReducer, uid, initialDeckImportState);
  // Derivation hides the previous user's values until the post-commit scope reset is applied.
  const currentState = state.uid === uid ? state : initialDeckImportState(uid);
  useEffect(() => {
    if (sessionRef.current.uid === uid) return;
    sessionRef.current = createSession(uid);
    dispatch({ type: "userChanged", uid });
  }, [uid]);
  // Object identity rejects stale work even across an A-to-B-to-A user transition where the UID matches again.
  const isCurrent = (session: DeckImportSession) => sessionRef.current === session;
  const publish = (session: DeckImportSession, event: Parameters<typeof dispatch>[0]) => {
    if (isCurrent(session)) dispatch(event);
  };
  const startSession = (session: DeckImportSession) => {
    if (session.uid !== uid || !isCurrent(session)) {
      throw new Error("Deck import user changed before the import could start");
    }
    if (session.running) throw new Error("A Deck import is already running");
    session.running = true;
  };
  const finishSession = (session: DeckImportSession) => {
    if (isCurrent(session)) session.running = false;
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

  const run = async (input: DeckImportInput, session: DeckImportSession) => {
    startSession(session);
    let retryInput = input;
    dispatch({ type: "importStarted", uid: session.uid, input });
    try {
      const attempt = await prepareInput(input);
      if (!isCurrent(session)) throw new Error("Deck import user changed before the import could start");
      // Once IDs and mutations are prepared, retries must reuse that exact attempt instead of replanning.
      retryInput = attempt;
      const result = await executePreparedDeckImport(attempt, dependencies);
      publish(session, { type: "importSucceeded", uid: session.uid, result, attempt });
      return result;
    } catch (error) {
      publish(session, { type: "importFailed", uid: session.uid, error, input: retryInput });
      throw error;
    } finally {
      finishSession(session);
    }
  };

  const retry = () => {
    const session = sessionRef.current;
    const input = currentState.retryInput;
    if (input != null && !session.running) void run(input, session).catch(() => undefined);
  };

  const selectFile = async (file: File) => {
    const session = sessionRef.current;
    if (session.uid !== uid) throw new Error("Deck import user changed before the preview could start");
    if (session.running) throw new Error("A Deck import is already running");
    dispatch({ type: "validationStarted", uid: session.uid });
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
      dispatch({ type: "validationSucceeded", uid: session.uid, preview, attempt });
      return preview;
    } catch (previewError) {
      publish(session, { type: "validationFailed", uid: session.uid, error: previewError });
      throw previewError;
    }
  };

  const { preview, previewAttempt, previewError, validating, pending, error, data } = currentState;

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
    if (previewAttempt == null) return Promise.reject(new Error("The prepared Deck import is not available"));
    return run(previewAttempt, session);
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
    pending,
    error,
    previewError,
    data,
    partialResult: partialResultFrom(error),
    retry,
  };
};
