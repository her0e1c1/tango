import type React from "react";
import { useSelector } from "react-redux";
import { useKey } from "react-use";
import * as C from "@/constant";
import { DeckImportTemplate } from "@/features/import/components/templates/DeckImportTemplate";
import * as selector from "@/selector";
import { useActions } from "@/shared/hooks/useActions";

export const DeckImportContainer: React.FC = () => {
  const actions = useActions();
  const config = useSelector(selector.config.get());
  useKey("t", actions.goToTop);
  useKey("s", actions.goToSettings);

  return (
    <DeckImportTemplate
      onChange={actions.deckUploadAndBack}
      onDownloadSample={actions.deckDownloadCsvSampleText}
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
