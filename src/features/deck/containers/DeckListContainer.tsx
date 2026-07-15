import type * as React from "react";
import { useSelector } from "react-redux";
import { useKey } from "react-use";

import * as selector from "@/selector";
import { useActions } from "@/shared/hooks/useActions";
import { DeckListTemplate } from "@/features/deck/components/templates/DeckListTemplate";
import { useStudyStore } from "@/features/study/hooks/useStudyStore";

export const DeckListContainer: React.FC = () => {
  const actions = useActions();
  const config = useSelector(selector.config.get());
  const decks = useSelector(selector.deck.getAll());
  const studySession = useStudyStore((state) => state.session);
  useKey("s", actions.goToSettings);
  useKey("i", actions.goToImport);

  return (
    <DeckListTemplate
      decks={decks}
      {...(studySession != null
        ? {
            studyProgress: {
              deckId: studySession.deckId,
              currentIndex: studySession.currentIndex,
              cardCount: studySession.cardOrderIds.length,
            },
          }
        : {})}
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
