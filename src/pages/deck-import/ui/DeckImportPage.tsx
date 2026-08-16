import type React from "react";
import { useKey } from "react-use";

import { usePreferences } from "@/entities/preferences";
import { DeckImportView, downloadSampleCsv, SAMPLE_CSV_TEXT, useDeckImport } from "@/features/deck-import";
import { routes, useNavigation } from "@/shared/routes";
import { AppLayout } from "@/widgets/app-layout";

export const DeckImportPage: React.FC = () => {
  const preferences = usePreferences();
  const navigation = useNavigation();
  const deckImport = useDeckImport();
  useKey("t", () => void navigation.to(routes.deckList.to()));
  useKey("s", () => void navigation.to(routes.settings.to()));

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
            .then(() => navigation.to(routes.deckList.to()))
            .catch(() => undefined);
        }}
        onBack={() => void navigation.back()}
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
