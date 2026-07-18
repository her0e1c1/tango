import type React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";
import * as C from "@/constant";
import { DeckImportTemplate } from "@/features/import/components/templates/DeckImportTemplate";
import { useActions } from "@/hooks/useActions";
import { useDeckImport } from "@/features/import/hooks/useDeckImport";
import { RemoteMutationNotice } from "@/components";
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
        void deckImport
          .importFile(file)
          .then(() => navigate(-1))
          .catch(() => undefined);
      }}
      onAddSample={() => {
        void deckImport
          .addSample()
          .then(() => navigate(-1))
          .catch(() => undefined);
      }}
      onDownloadSample={actions.deckDownloadCsvSampleText}
      pending={deckImport.pending}
      feedbackSlot={
        <RemoteMutationNotice pending={deckImport.pending} error={deckImport.error} onRetry={deckImport.retry} />
      }
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
