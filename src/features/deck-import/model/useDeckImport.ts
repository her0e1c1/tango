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
  const execution = useDeckImportExecution(uid, decks);
  const preview = useDeckImportPreview({ uid, decks, cards });
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

  const setDestinationType = (destinationType: typeof preview.destinationType) => {
    if (preview.setDestinationType(destinationType)) execution.clear();
  };

  const setDestinationDeckId = (destinationDeckId: string) => {
    if (preview.setDestinationDeckId(destinationDeckId)) execution.clear();
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
    // Keep the same prepared IDs after a failure so retrying cannot leave an additional partial Deck.
    preview.completePreparedImport();
    return result;
  };

  return {
    selectFile,
    setStorageMode,
    setDestinationType,
    setDestinationDeckId,
    importPreview,
    addSample: () => runImport(() => prepareSampleDeck(uid, { cards, decks, generateCardId })),
    storageMode: preview.storageMode,
    destinationType: preview.destinationType,
    destinationDeckId: preview.destinationDeckId,
    destinationOptions: preview.destinationOptions,
    preview: preview.preview,
    validating: status === "validating",
    pending: status === "importing",
    error: execution.error,
    previewError: preview.error,
    result: execution.result,
    dark: preferences.appearance.darkMode,
  };
};
