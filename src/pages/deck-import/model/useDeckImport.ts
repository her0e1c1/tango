import { useState } from "react";

import { useAuthUid } from "@/entities/auth";
import { usePreferences } from "@/entities/preference";
import { addSampleDeck } from "@/features/sample-import";
import type { DeckImportResult, DeckImportStorageMode } from "./useDeckImportExecution";
import { useDeckImportExecution } from "./useDeckImportExecution";
import { useDeckImportPreview } from "./useDeckImportPreview";

type DeckImportStatus = "idle" | "validating" | "importing" | "adding-sample";
type DeckImportSaveStatus = Extract<DeckImportStatus, "importing" | "adding-sample">;

export const useDeckImport = () => {
  const uid = useAuthUid();
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

  const runSave = async (nextStatus: DeckImportSaveStatus, operation: () => Promise<DeckImportResult | undefined>) => {
    preview.clearError();
    setStatus(nextStatus);
    try {
      return await operation();
    } finally {
      setStatus("idle");
    }
  };

  const importPreview = async () => {
    const result = await runSave("importing", () => execution.runPrepared(preview.getPreparedImport));
    if (result === undefined) return;
    // Failed writes retain generated IDs so retrying cannot create another partial Deck.
    preview.completePreparedImport();
    return result;
  };

  const addSample = () => runSave("adding-sample", () => execution.run(() => addSampleDeck(uid)));

  return {
    selectFile,
    setStorageMode,
    importPreview,
    addSample,
    storageMode: preview.storageMode,
    preview: preview.preview,
    validating: status === "validating",
    pending: status === "importing",
    addingSample: status === "adding-sample",
    error: execution.error,
    previewError: preview.error,
    result: execution.result,
    dark: preferences.appearance.darkMode,
  };
};
