import React from "react";
import { useKey } from "react-use";
import { DeckImport } from "src/component/Template";
import { useActions } from "./hooks";
import { useSelector } from "react-redux";
import * as selector from "src/selector";

export const DeckImportPage: React.FC = () => {
  const actions = useActions();
  const config = useSelector(selector.config.get());
  useKey("t", actions.goToTop);
  useKey("s", actions.goToSettings);
  return (
    <DeckImport
      onChange={actions.deckUploadAndBack}
      onDonloadSample={actions.deckDownloadCsvSampleText}
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
