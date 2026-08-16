import { useState } from "react";

import { useAuthUid } from "@/entities/auth";
import { generateCardId, useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
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
  const execution = useDeckImportExecution(uid);
  const preview = useDeckImportPreview({ uid, cards, decks });
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

  return {
    selectFile,
    setStorageMode,
    importPreview: () => runImport(preview.takePreparedImport),
    addSample: () => runImport(() => prepareSampleDeck(uid, { cards, decks, generateCardId })),
    storageMode: preview.storageMode,
    preview: preview.preview,
    validating: status === "validating",
    pending: status === "importing",
    error: execution.error,
    previewError: preview.error,
    result: execution.result,
  };
};
