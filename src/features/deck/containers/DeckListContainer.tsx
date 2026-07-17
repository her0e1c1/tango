import * as React from "react";
import { useKey } from "react-use";

import * as action from "@/action";
import { DeckListTemplate } from "@/features/deck/components/templates/DeckListTemplate";
import { useDeckMutations } from "@/features/deck/hooks/useDeckMutations";
import { buildDeckListSections } from "@/features/deck/lib/buildDeckListSections";
import { useSampleDeckBootstrap } from "@/features/import/hooks/useSampleDeckBootstrap";
import { useConfig } from "@/features/settings/hooks/useConfig";
import { useStudyHydrated } from "@/features/study/hooks/useStudyHydrated";
import { useStudyStore } from "@/features/study/hooks/useStudyStore";
import { studyStore } from "@/features/study/state/studyStore";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { RemoteMutationNotice, RemoteReadBoundary } from "@/shared/components";
import { useActions } from "@/shared/hooks/useActions";

export const DeckListContainer: React.FC = () => {
  const actions = useActions();
  const config = useConfig();
  const remote = useRemoteCollections();
  const mutations = useDeckMutations();
  const [openMenuDeckId, setOpenMenuDeckId] = React.useState<DeckId>();
  const sessionsByDeckId = useStudyStore((state) => state.sessionsByDeckId);
  const hydrated = useStudyHydrated();
  const sections = React.useMemo(
    () => buildDeckListSections(remote.decks, remote.cards, sessionsByDeckId),
    [remote.cards, remote.decks, sessionsByDeckId]
  );
  useSampleDeckBootstrap();
  useKey("s", actions.goToSettings);
  useKey("i", actions.goToImport);

  React.useEffect(() => {
    if (!hydrated || mutations.pending || remote.status !== "ready") return;
    const deckIds = new Set(remote.decks.map((deck) => deck.id));
    for (const deckId of Object.keys(studyStore.getState().sessionsByDeckId)) {
      if (!deckIds.has(deckId)) studyStore.getState().removeStudy(deckId);
    }
  }, [hydrated, mutations.pending, remote.decks, remote.status]);

  return (
    <RemoteReadBoundary
      status={remote.status}
      hasData={remote.decks.length > 0}
      emptyLabel="No decks yet."
      onRetry={remote.retry}
    >
      {hydrated ? (
        <DeckListTemplate
          sections={sections}
          feedbackSlot={
            <RemoteMutationNotice pending={mutations.pending} error={mutations.error} onRetry={mutations.retry} />
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
            openMenuDeckId,
            onToggleMenu: (id) => setOpenMenuDeckId((value) => (value === id ? undefined : id)),
            onCloseMenu: () => setOpenMenuDeckId(undefined),
            onClickEdit: actions.goToEdit,
            onClickName: actions.goToView,
            onClickContinue: (id) => {
              studyStore.getState().touchStudy(id);
              actions.goToStudy(id);
            },
            onClickRestart: actions.goToStart,
            onClickStudy: actions.goToStart,
            onClickDownload: (id) => {
              const deck = remote.deckById(id);
              if (deck != null) action.deck.downloadData(deck, remote.cardsByDeckId(id));
            },
            onClickDelete: (id) => {
              const deck = remote.deckById(id);
              if (deck != null && window.confirm("Are you sure of removing this deck?")) {
                void mutations
                  .remove(deck)
                  .then(() => studyStore.getState().removeStudy(id))
                  .catch(() => undefined);
              }
            },
          }}
        />
      ) : (
        <div role="status" className="py-10 text-center text-sm text-ink-muted">
          Loading study progress…
        </div>
      )}
    </RemoteReadBoundary>
  );
};
