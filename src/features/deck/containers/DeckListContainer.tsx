import type * as React from "react";
import { useSelector } from "react-redux";
import { useKey } from "react-use";

import * as action from "@/action";
import * as selector from "@/selector";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { RemoteReadBoundary } from "@/shared/components";
import { useActions } from "@/shared/hooks/useActions";
import { DeckListTemplate } from "@/features/deck/components/templates/DeckListTemplate";
import { useStudyStore } from "@/features/study/hooks/useStudyStore";

export const DeckListContainer: React.FC = () => {
  const actions = useActions();
  const config = useSelector(selector.config.get());
  const remote = useRemoteCollections();
  const decks = remote.decks;
  const studySession = useStudyStore((state) => state.session);
  useKey("s", actions.goToSettings);
  useKey("i", actions.goToImport);

  return (
    <RemoteReadBoundary
      status={remote.status}
      hasData={decks.length > 0}
      emptyLabel="No decks yet."
      onRetry={remote.retry}
    >
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
          onClickDownload: (id) => {
            const deck = remote.deckById(id);
            if (deck != null) action.deck.downloadData(deck, remote.cardsByDeckId(id));
          },
          onClickDelete: actions.deckRemove,
          // onClickReimport: actions.deckReimport,
        }}
      />
    </RemoteReadBoundary>
  );
};
