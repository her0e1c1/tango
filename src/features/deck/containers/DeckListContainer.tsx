import * as React from "react";
import { useSelector } from "react-redux";
import { useKey } from "react-use";

import * as selector from "@src/selector";
import { useActions } from "@src/shared/hooks/useActions";
import { DeckListTemplate } from "@src/features/deck/components/templates/DeckListTemplate";

export const DeckListContainer: React.FC = () => {
  const actions = useActions();
  const config = useSelector(selector.config.get());
  const decks = useSelector(selector.deck.getAll());
  useKey("s", actions.goToSettings);
  useKey("i", actions.goToImport);

  return (
    <DeckListTemplate
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
        // onClickReimport: actions.deckReimport,
      }}
    />
  );
};
