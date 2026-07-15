import * as React from "react";
import { useSelector } from "react-redux";
import { useKey } from "react-use";

import * as selector from "@src/selector";
import { useActions } from "@src/shared/hooks/useActions";
import { DeckListTemplate } from "@src/features/deck/components/templates/DeckListTemplate";
import { getLegacyStudyCandidate } from "@src/features/study/hooks/useLegacyStudySession";
import { useStudyStore } from "@src/features/study/hooks/useStudyStore";

export const DeckListContainer: React.FC = () => {
  const actions = useActions();
  const config = useSelector(selector.config.get());
  const decks = useSelector(selector.deck.getAll());
  const studySession = useStudyStore((state) => state.session);
  const legacyMigratedDeckIds = useStudyStore((state) => state.legacyMigratedDeckIds);
  const legacyRestartableDeckIds = React.useMemo(
    () =>
      studySession == null
        ? decks
            .filter((deck) => !legacyMigratedDeckIds[deck.id] && getLegacyStudyCandidate(deck) != null)
            .map((deck) => deck.id)
        : [],
    [decks, legacyMigratedDeckIds, studySession]
  );
  useKey("s", actions.goToSettings);
  useKey("i", actions.goToImport);

  return (
    <DeckListTemplate
      decks={decks}
      restartableDeckIds={legacyRestartableDeckIds}
      studyProgress={
        studySession == null
          ? undefined
          : {
              deckId: studySession.deckId,
              currentIndex: studySession.currentIndex,
              cardCount: studySession.cardOrderIds.length,
            }
      }
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
