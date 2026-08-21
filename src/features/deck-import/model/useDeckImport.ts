import { useState } from "react";

import { useAuthUid } from "@/entities/auth";
import { updatePreferences, usePreferences } from "@/entities/preference";
import { prepareSampleDeck } from "./useAddSampleDeck";
import type { DeckImportStorageMode, PreparedDeckImport } from "./useDeckImportExecution";
import { useDeckImportExecution } from "./useDeckImportExecution";
import { useDeckImportPreview } from "./useDeckImportPreview";

export type { DeckImportPreview } from "./useDeckImportPreview";

type DeckImportStatus = "idle" | "validating" | "importing";

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
      return await preview.selectFile(file);
    } finally {
      setStatus("idle");
    }
  };

  const setStorageMode = (storageMode: DeckImportStorageMode) => {
    if (preview.setStorageMode(storageMode)) execution.clear();
  };

  const runImport = async (prepare: () => PreparedDeckImport) => {
    const preparedImport = prepare();
    preview.clearError();
    setStatus("importing");
    try {
      return await execution.run(preparedImport);
    } finally {
      setStatus("idle");
    }
  };

  const importPreview = async () => {
    const result = await runImport(preview.getPreparedImport);
    // Preserve generated IDs after a failed write so retrying cannot create another partial Deck.
    preview.completePreparedImport();
    return result;
  };

  const addSample = async () => {
    const result = await runImport(() => prepareSampleDeck(uid));
    // Explicit imports remain available, but a successful one also satisfies the automatic bootstrap permanently.
    updatePreferences({ loadSample: false });
    return result;
  };

  return {
    selectFile,
    setStorageMode,
    importPreview,
    addSample,
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
