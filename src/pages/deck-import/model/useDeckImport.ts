import { useState } from "react";

import { useGoogleAccountUid } from "@/entities/auth";
import { usePreferences } from "@/entities/preference";
import { addSampleDeck } from "@/features/sample-deck";
import type { DeckImportResult, DeckImportStorageMode } from "./useDeckImportExecution";
import { useDeckImportExecution } from "./useDeckImportExecution";
import { useDeckImportPreview } from "./useDeckImportPreview";

type DeckImportStatus = "idle" | "validating" | "importing";

export const useDeckImport = () => {
  const uid = useGoogleAccountUid();
  const preferences = usePreferences();
  const execution = useDeckImportExecution(uid);
  const preview = useDeckImportPreview(uid);
  const [status, setStatus] = useState<DeckImportStatus>("idle");

  const selectFile = async (file: File) => {
    execution.clear();
    setStatus("validating");
    try {
      await preview.selectFile(file);
    } finally {
      setStatus("idle");
    }
  };

  const setStorageMode = (storageMode: DeckImportStorageMode) => {
    if (preview.setStorageMode(storageMode)) execution.clear();
  };

  const runImport = async (operation: () => Promise<DeckImportResult | undefined>) => {
    preview.clearError();
    setStatus("importing");
    try {
      return await operation();
    } finally {
      setStatus("idle");
    }
  };

  const importPreview = async () => {
    const result = await runImport(() => execution.runPrepared(preview.getPreparedImport));
    if (result === undefined) return;
    // Failed writes retain generated IDs so retrying cannot create another partial Deck.
    preview.completePreparedImport();
    return result;
  };

  const addSample = () => runImport(() => execution.run(() => addSampleDeck(uid)));

  return {
    selectFile,
    setStorageMode,
    importPreview,
    addSample,
    remoteStorageAvailable: uid !== "",
    storageMode: preview.storageMode,
    preview: preview.preview,
    validating: status === "validating",
    pending: status === "importing",
    error: execution.error,
    previewError: preview.error,
    result: execution.result,
    dark: preferences.appearance.darkMode,
  };
};
