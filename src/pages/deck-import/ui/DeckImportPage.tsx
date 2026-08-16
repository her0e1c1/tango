import type React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { createDeck, useDecks } from "@/entities/deck";
import { generateCardId, useCards } from "@/entities/card";
import { usePreferences } from "@/entities/preferences";
import { DeckImportView, downloadSampleCsv, SAMPLE_CSV_TEXT, useDeckImport } from "@/features/deck-import";
import { AppLayout } from "@/widgets/app-layout";

export const DeckImportPage: React.FC = () => {
  const preferences = usePreferences();
  const navigate = useNavigate();
  const cards = useCards();
  const decks = useDecks();
  const deckImport = useDeckImport({
    cards,
    createDeck,
    decks,
    generateCardId,
  });
  useKey("t", () => void navigate("/"));
  useKey("s", () => void navigate("/settings"));

  return (
    <AppLayout showHeader>
      <DeckImportView
        storageMode={deckImport.storageMode}
        onStorageModeChange={deckImport.setStorageMode}
        onChange={(file) => {
          void deckImport.selectFile(file).catch(() => undefined);
        }}
        onAddSample={() => {
          void deckImport.addSample().catch(() => undefined);
        }}
        onImport={() => {
          void deckImport
            .importPreview()
            .then(() => navigate("/"))
            .catch(() => undefined);
        }}
        onRetry={deckImport.retry}
        onBack={() => void navigate(-1)}
        onDownloadSample={downloadSampleCsv}
        validating={deckImport.validating}
        pending={deckImport.pending}
        {...(deckImport.preview !== undefined ? { preview: deckImport.preview } : {})}
        {...(deckImport.data !== undefined ? { result: deckImport.data } : {})}
        {...(deckImport.partialResult !== undefined ? { partialResult: deckImport.partialResult } : {})}
        error={deckImport.error}
        previewError={deckImport.previewError}
        dark={preferences.appearance.darkMode}
        sampleText={SAMPLE_CSV_TEXT}
      />
    </AppLayout>
  );
};
