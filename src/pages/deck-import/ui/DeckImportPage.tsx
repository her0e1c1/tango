import type React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { DeckImportView, downloadSampleCsv, SAMPLE_CSV_TEXT, useDeckImport } from "@/features/deck-import";
import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";

export const DeckImportPage: React.FC = () => {
  const navigate = useNavigate();
  const deckImport = useDeckImport();
  useKey("t", () => void navigate(routes.deckList.to()));
  useKey("s", () => void navigate(routes.settings.to()));

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
            .then(() => navigate(routes.deckList.to()))
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
        dark={deckImport.dark}
        sampleText={SAMPLE_CSV_TEXT}
      />
    </AppLayout>
  );
};
