import { useAuthUid } from "@/entities/auth";
import { generateCardId, useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import type { DeckImportStorageMode, PreparedDeckImport } from "./deckImportExecution";
import { prepareSampleDeck } from "./sampleDeck";
import { useDeckImportExecution } from "./useDeckImportExecution";
import { useDeckImportOperation } from "./useDeckImportOperation";
import { useDeckImportPreview } from "./useDeckImportPreview";

export type { DeckImportPreview } from "./useDeckImportPreview";

export const useDeckImport = () => {
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();
  const operation = useDeckImportOperation(uid);
  const execution = useDeckImportExecution(uid);
  const preview = useDeckImportPreview({ uid, cards, decks });

  const selectFile = (file: File) =>
    operation.run("validating", (scope) => {
      execution.clear();
      return preview.selectFile(file, scope);
    });

  const setStorageMode = (storageMode: DeckImportStorageMode) => {
    if (operation.isRunning()) return;
    if (preview.setStorageMode(storageMode)) execution.clear();
  };

  const runImport = (prepare: () => PreparedDeckImport) =>
    operation.run("importing", (scope) => {
      const preparedImport = prepare();
      preview.clearError();
      return execution.run(preparedImport, scope);
    });

  return {
    selectFile,
    setStorageMode,
    importPreview: () => runImport(preview.takePreparedImport),
    addSample: () => runImport(() => prepareSampleDeck(uid, { cards, decks, generateCardId })),
    storageMode: preview.storageMode,
    preview: preview.preview,
    validating: operation.status === "validating",
    pending: operation.status === "importing",
    error: execution.error,
    previewError: preview.error,
    result: execution.result,
  };
};
