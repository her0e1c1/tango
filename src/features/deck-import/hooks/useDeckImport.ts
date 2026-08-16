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

type DeckImportFailure =
  | { stage: "preview"; error: unknown }
  | { stage: "import"; error: unknown };

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

  const [storageMode, setStorageModeState] = useState<DeckImportStorageMode>("remote");
  const [status, setStatus] = useState<DeckImportStatus>("idle");
  const [preview, setPreview] = useState<DeckImportPreview | undefined>(undefined);
  const [failure, setFailure] = useState<DeckImportFailure | undefined>(undefined);
  const [data, setData] = useState<DeckImportResult | undefined>(undefined);

  useEffect(() => {
    generationRef.current += 1;
    busyRef.current = false;
    previewAttemptRef.current = undefined;
    retryAttemptRef.current = undefined;
    setStorageModeState("remote");
    setStatus("idle");
    setPreview(undefined);
    setFailure(undefined);
    setData(undefined);
  }, [uid]);

  const isCurrent = (generation: number) => generation === generationRef.current;

  const run = async (attempt: DeckImportAttempt) => {
    if (busyRef.current) throw new Error("A Deck import is already running");

    const generation = generationRef.current;
    busyRef.current = true;
    retryAttemptRef.current = attempt;
    setStatus("importing");
    setFailure(undefined);

    try {
      const result = await executePreparedDeckImport(attempt, {
        uid,
        createDeck: (deck) => createDeck(uid, deck),
        mutateCards: (mutations) => mutateCards(uid, mutations),
      });
      if (isCurrent(generation)) setData(result);
      return result;
    } catch (error) {
      if (isCurrent(generation)) {
        setData(undefined);
        setFailure({ stage: "import", error });
      }
      throw error;
    } finally {
      if (isCurrent(generation)) {
        busyRef.current = false;
        setStatus("idle");
      }
    }
  };

  const retry = () => {
    const attempt = retryAttemptRef.current;
    if (attempt != null && !busyRef.current) void run(attempt).catch(() => undefined);
  };

  const setStorageMode = (nextStorageMode: DeckImportStorageMode) => {
    if (busyRef.current || storageMode === nextStorageMode) return;

    previewAttemptRef.current = undefined;
    retryAttemptRef.current = undefined;
    setStorageModeState(nextStorageMode);
    setPreview(undefined);
    setFailure(undefined);
    setData(undefined);
  };

  const selectFile = async (file: File) => {
    if (busyRef.current) throw new Error("A Deck import is already running");

    const generation = generationRef.current;
    busyRef.current = true;
    previewAttemptRef.current = undefined;
    retryAttemptRef.current = undefined;
    setStatus("validating");
    setPreview(undefined);
    setFailure(undefined);
    setData(undefined);

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
      const nextPreview = {
        deckName: file.name,
        analysis,
        plan: attempt.plan,
      };
      previewAttemptRef.current = attempt;
      setPreview(nextPreview);
      return nextPreview;
    } catch (error) {
      if (isCurrent(generation)) setFailure({ stage: "preview", error });
      throw error;
    } finally {
      if (isCurrent(generation)) {
        busyRef.current = false;
        setStatus("idle");
      }
    }
  };

  const importPreview = () => {
    if (busyRef.current) return Promise.reject(new Error("A Deck import is already running"));
    if (preview == null) return Promise.reject(new Error("Select a CSV file before importing"));
    if (preview.analysis.invalidCount > 0) {
      return Promise.reject(new Error("Fix invalid CSV rows before importing"));
    }
    if (preview.analysis.rows.length === 0) {
      return Promise.reject(new Error("The CSV file has no valid rows"));
    }

    const attempt = previewAttemptRef.current;
    if (attempt == null) return Promise.reject(new Error("The prepared Deck import is not available"));
    return run(attempt);
  };

  const error = failure?.stage === "import" ? failure.error : null;

  return {
    selectFile,
    setStorageMode,
    importPreview,
    addSample: () => run(prepareSampleDeck(uid, { cards, decks, generateCardId })),
    storageMode,
    preview,
    validating: status === "validating",
    pending: status === "importing",
    error,
    previewError: failure?.stage === "preview" ? failure.error : null,
    data,
    partialResult: partialResultFrom(error),
    retry,
  };
};
