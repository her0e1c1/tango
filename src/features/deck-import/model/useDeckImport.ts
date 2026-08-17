import { useState } from "react";

import { useAuthUid } from "@/entities/auth";
import { generateCardId, useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import { prepareSampleDeck } from "./useAddSampleDeck";
import type { DeckImportResult, DeckImportStorageMode, PreparedDeckImport } from "./useDeckImportExecution";
import { useDeckImportExecution } from "./useDeckImportExecution";
import { useDeckImportPreview } from "./useDeckImportPreview";

export type { DeckImportPreview } from "./useDeckImportPreview";

type DeckImportStatus = "idle" | "validating" | "importing";
type DeckImportOperationResult<Value> = { status: "success"; value: Value } | { status: "failure" };

const operationSucceeded = <Value>(value: Value): DeckImportOperationResult<Value> => ({ status: "success", value });
const operationFailed = { status: "failure" } as const;

export const useDeckImport = () => {
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();
  const preferences = usePreferences();
  const execution = useDeckImportExecution(uid);
  const preview = useDeckImportPreview({ uid, cards, decks });
  const [status, setStatus] = useState<DeckImportStatus>("idle");

  const selectFile = async (file: File) => {
    execution.clear();
    setStatus("validating");
    try {
      const selectedPreview = await preview.selectFile(file);
      return selectedPreview === undefined ? operationFailed : operationSucceeded(selectedPreview);
    } finally {
      setStatus("idle");
    }
  };

  const setStorageMode = (storageMode: DeckImportStorageMode) => {
    if (preview.setStorageMode(storageMode)) execution.clear();
  };

  const runImport = async (
    prepare: () => PreparedDeckImport | undefined
  ): Promise<DeckImportOperationResult<DeckImportResult>> => {
    const preparedImport = prepare();
    if (preparedImport === undefined) return operationFailed;

    preview.clearError();
    setStatus("importing");
    try {
      const importResult = await execution.run(preparedImport);
      return importResult === undefined ? operationFailed : operationSucceeded(importResult);
    } finally {
      setStatus("idle");
    }
  };

  const addSample = () => {
    if (uid === "") {
      execution.fail(new Error("A confirmed user is required for remote imports"));
      return Promise.resolve(operationFailed);
    }
    return runImport(() => prepareSampleDeck(uid, { cards, decks, generateCardId }));
  };

  return {
    selectFile,
    setStorageMode,
    importPreview: () => runImport(preview.takePreparedImport),
    addSample,
    storageMode: preview.storageMode,
    fileName: preview.fileName,
    preview: preview.preview,
    validating: status === "validating",
    pending: status === "importing",
    error: execution.error,
    previewError: preview.error,
    result: execution.result,
    dark: preferences.appearance.darkMode,
  };
};
