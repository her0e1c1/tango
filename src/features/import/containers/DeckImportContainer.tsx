import type React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";
import * as C from "@/constant";
import { DeckImportTemplate } from "@/features/import/components/templates/DeckImportTemplate";
import { useActions } from "@/hooks/useActions";
import { useDeckImport } from "@/features/import/hooks/useDeckImport";
import { useConfig } from "@/hooks/useConfig";

export const DeckImportContainer: React.FC = () => {
  const actions = useActions();
  const config = useConfig();
  const navigate = useNavigate();
  const deckImport = useDeckImport();
  useKey("t", actions.goToTop);
  useKey("s", actions.goToSettings);

  return (
    <DeckImportTemplate
      onChange={(file) => {
        void deckImport.selectFile(file).catch(() => undefined);
      }}
      onAddSample={() => {
        void deckImport.addSample().catch(() => undefined);
      }}
      onImport={() => {
        void deckImport.importPreview().catch(() => undefined);
      }}
      onRetry={deckImport.retry}
      onBack={() => navigate(-1)}
      onDownloadSample={actions.deckDownloadCsvSampleText}
      validating={deckImport.validating}
      pending={deckImport.pending}
      {...(deckImport.preview !== undefined ? { preview: deckImport.preview } : {})}
      {...(deckImport.data !== undefined ? { result: deckImport.data } : {})}
      {...(deckImport.partialResult !== undefined ? { partialResult: deckImport.partialResult } : {})}
      error={deckImport.error}
      dark={config.darkMode}
      sampleText={C.CSV_SAMPLE_TEXT}
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
        },
      }}
    />
  );
};
