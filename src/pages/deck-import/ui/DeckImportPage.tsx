import type React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { usePreferences } from "@/entities/preferences";
import { DeckImportView, downloadSampleCsv, SAMPLE_CSV_TEXT, useDeckImport } from "@/features/deck-import";
import { AppLayout } from "@/widgets/app-layout";

export const DeckImportPage: React.FC = () => {
  const preferences = usePreferences();
  const navigate = useNavigate();
  const deckImport = useDeckImport();
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
        onBack={() => void navigate(-1)}
        onDownloadSample={downloadSampleCsv}
        validating={deckImport.validating}
        pending={deckImport.pending}
        preview={deckImport.preview}
        result={deckImport.result}
        error={deckImport.error}
        previewError={deckImport.previewError}
        dark={preferences.appearance.darkMode}
        sampleText={SAMPLE_CSV_TEXT}
      />
    </AppLayout>
  );
};
