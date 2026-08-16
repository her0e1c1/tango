import { useAuthUid } from "@/entities/auth";
import { generateCardId, useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
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
  const execution = useDeckImportExecution(uid, operation);
  const preview = useDeckImportPreview({
    uid,
    cards,
    decks,
    operation,
    run: execution.run,
    clearExecution: execution.clear,
  });

  return {
    selectFile: preview.selectFile,
    setStorageMode: preview.setStorageMode,
    importPreview: preview.importPreview,
    addSample: () => {
      preview.clearPreviewError();
      return execution.run(prepareSampleDeck(uid, { cards, decks, generateCardId }));
    },
    storageMode: preview.storageMode,
    preview: preview.preview,
    validating: operation.status === "validating",
    pending: operation.status === "importing",
    error: execution.error,
    previewError: preview.previewError,
    result: execution.result,
  };
};
