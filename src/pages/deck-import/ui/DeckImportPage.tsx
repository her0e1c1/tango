import type React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import * as C from "@/constant";
import { useDeckImport } from "@/features/import";
import { useActions } from "@/hooks/useActions";
import { useConfig } from "@/shared/config/useConfig";

import { DeckImportView } from "./DeckImportView";

export const DeckImportPage: React.FC = () => {
  const actions = useActions();
  const config = useConfig();
  const navigate = useNavigate();
  const deckImport = useDeckImport();
  useKey("t", actions.goToTop);
  useKey("s", actions.goToSettings);

  return (
    <DeckImportView
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
      onBack={() => navigate(-1)}
      onDownloadSample={actions.deckDownloadCsvSampleText}
      validating={deckImport.validating}
      pending={deckImport.pending}
      {...(deckImport.preview !== undefined ? { preview: deckImport.preview } : {})}
      {...(deckImport.data !== undefined ? { result: deckImport.data } : {})}
      {...(deckImport.partialResult !== undefined ? { partialResult: deckImport.partialResult } : {})}
      error={deckImport.error}
      dark={config.appearance.darkMode}
      sampleText={C.CSV_SAMPLE_TEXT}
      layout={{
        headerProps: {
          dark: config.appearance.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickImport: actions.goToImport,
          onClickSettings: actions.goToSettings,
        },
      }}
    />
  );
};
