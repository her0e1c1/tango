import React from "react";
import { useKey } from "react-use";
import { useSelector } from "react-redux";
import * as selector from "src/selector";
import { DeckList } from "src/component/Template";
import { useActions } from "./hooks";

export const DeckListPage: React.FC = () => {
  const actions = useActions();
  const config = useSelector(selector.config.get());
  const decks = useSelector(selector.deck.getAll());
  useKey("s", actions.goToSettings);
  useKey("i", actions.goToImport);
  return (
    <DeckList
      decks={decks}
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
        },
      }}
      deckCard={{
        onClickEdit: actions.goToEdit,
        onClickName: actions.goToView,
        onClickRestart: actions.goToStudy,
        onClickStudy: actions.goToStart,
        onClickDownload: actions.deckDownload,
        onClickDelete: actions.deckRemove,
        onClickReimport: actions.deckReimport,
      }}
    />
  );
};
