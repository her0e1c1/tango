import { useState } from "react";

import { useAuthUid } from "@/entities/auth";
import { generateCardId, useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import { prepareSampleDeck } from "./useAddSampleDeck";
import type { DeckImportStorageMode, PreparedDeckImport } from "./useDeckImportExecution";
import { useDeckImportExecution } from "./useDeckImportExecution";
import { useDeckImportPreview } from "./useDeckImportPreview";

export type { DeckImportPreview } from "./useDeckImportPreview";

type DeckImportStatus = "idle" | "validating" | "importing";

export const useDeckImport = () => {
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();
  const preferences = usePreferences();
  const execution = useDeckImportExecution(uid);
  const preview = useDeckImportPreview({ uid, cards, decks });
  const [status, setStatus] = useState<DeckImportStatus>("idle");
  const [fileReselectionRequired, setFileReselectionRequired] = useState(false);

  const selectFile = async (file: File) => {
    execution.clear();
    setFileReselectionRequired(false);
    setStatus("validating");
    try {
      return await preview.selectFile(file);
    } finally {
      setStatus("idle");
    }
  };

  const setStorageMode = (storageMode: DeckImportStorageMode) => {
    if (preview.setStorageMode(storageMode)) {
      execution.clear();
      setFileReselectionRequired(false);
    }
  };

  const runImport = async (prepare: () => PreparedDeckImport | undefined, onExecutionFailure?: () => void) => {
    const preparedImport = prepare();
    if (preparedImport === undefined) return;

    preview.clearError();
    setStatus("importing");
    try {
      const importResult = await execution.run(preparedImport);
      if (importResult === undefined) onExecutionFailure?.();
      return importResult;
    } finally {
      setStatus("idle");
    }
  };

  const addSample = () => {
    setFileReselectionRequired(false);
    if (uid === "") {
      execution.fail(new Error("A confirmed user is required for remote imports"));
      return Promise.resolve();
    }
    return runImport(() => prepareSampleDeck(uid, { cards, decks, generateCardId }));
  };

  const importPreview = () =>
    runImport(preview.takePreparedImport, () => {
      // Persistence can fail after creating the Deck, so retry must rebuild a plan from current destination data.
      preview.invalidate();
      setFileReselectionRequired(true);
    });

  return {
    selectFile,
    setStorageMode,
    importPreview,
    addSample,
    storageMode: preview.storageMode,
    fileName: preview.fileName,
    preview: preview.preview,
    validating: status === "validating",
    pending: status === "importing",
    fileReselectionRequired,
    error: execution.error,
    previewError: preview.error,
    result: execution.result,
    dark: preferences.appearance.darkMode,
  };
};
