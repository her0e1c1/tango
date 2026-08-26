import type React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";
import { downloadSampleCsv, SAMPLE_CSV_TEXT } from "../lib/sampleCsv";
import { useDeckImport } from "../model/useDeckImport";
import { DeckImportView } from "./DeckImportView";

export const DeckImportPage: React.FC = () => {
  const navigate = useNavigate();
  const deckImport = useDeckImport();
  useKey("t", () => void navigate(routes.deckList.to()));
  useKey("s", () => void navigate(routes.settings.to()));

  return (
    <AppLayout showHeader>
      <DeckImportView
        storageMode={deckImport.storageMode}
        remoteStorageAvailable={deckImport.remoteStorageAvailable}
        onStorageModeChange={deckImport.setStorageMode}
        onChange={(file) => {
          void deckImport.selectFile(file);
        }}
        onAddSample={() => {
          void deckImport.addSample();
        }}
        onImport={() => {
          void deckImport.importPreview().then((result) => {
            if (result !== undefined) void navigate(routes.deckList.to());
          });
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
