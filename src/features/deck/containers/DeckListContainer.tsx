/**
 * @file Connects application state and operations to the deck feature's Deck List Container view.
 * The container prepares route data and callbacks, then delegates visual rendering to presentation
 * components.
 */

import * as React from "react";
import { useKey } from "react-use";

import * as action from "@/action";
import { DeckListTemplate } from "@/features/deck/components/templates/DeckListTemplate";
import { useDeckMutations } from "@/features/deck/hooks/useDeckMutations";
import { buildDeckListSections } from "@/features/deck/lib/buildDeckListSections";
import { useSampleDeckBootstrap } from "@/features/import/hooks/useSampleDeckBootstrap";
import { useConfig } from "@/hooks/useConfig";
import { useStudyHydrated } from "@/features/study/hooks/useStudyHydrated";
import { useStudyStore } from "@/features/study/hooks/useStudyStore";
import { studyStore } from "@/features/study/state/studyStore";
import { useRemoteCollections } from "@/hooks/useRemoteCollections";
import { DestructiveActionDialog, Feedback, RemoteMutationNotice, RemoteReadBoundary } from "@/components";
import { useActions } from "@/hooks/useActions";

/**
 * Connects the Deck List Container view to stores, remote data, route parameters, and mutations.
 * It prepares plain props for presentation components so those components remain independent of
 * application services.
 */
export const DeckListContainer: React.FC = () => {
  const actions = useActions();
  const config = useConfig();
  const remote = useRemoteCollections();
  const [deletionTarget, setDeletionTarget] = React.useState<{ deck: Deck; cardCount: number }>();
  const [successMessage, setSuccessMessage] = React.useState<string>();
  const mutations = useDeckMutations({
    onRemoveSuccess: (deck) => {
      studyStore.getState().removeStudy(deck.id);
      setDeletionTarget((target) => (target?.deck.id === deck.id ? undefined : target));
      setSuccessMessage(`Deleted deck “${deck.name}”.`);
    },
  });
  const [openMenuDeckId, setOpenMenuDeckId] = React.useState<DeckId>();
  const sessionsByDeckId = useStudyStore((state) => state.sessionsByDeckId);
  const hydrated = useStudyHydrated();
  const sections = buildDeckListSections(remote.decks, remote.cards, sessionsByDeckId);
  useSampleDeckBootstrap();
  useKey("s", actions.goToSettings);
  useKey("i", actions.goToImport);

  React.useEffect(() => {
    if (!hydrated || mutations.pending || remote.status !== "ready" || remote.syncStatus !== "synced") {
      return;
    }
    const deckIds = new Set(remote.decks.map((deck) => deck.id));
    for (const deckId of Object.keys(studyStore.getState().sessionsByDeckId)) {
      if (!deckIds.has(deckId)) studyStore.getState().removeStudy(deckId);
    }
  }, [hydrated, mutations.pending, remote.decks, remote.status, remote.syncStatus]);

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
            <>
              <RemoteMutationNotice
                pending={mutations.pending}
                error={mutations.error}
                onRetry={mutations.retry}
                pendingLabel="Deleting deck…"
                errorLabel="Unable to delete deck."
              />
              <Feedback tone="success">{successMessage}</Feedback>
            </>
          }
          dialogSlot={
            deletionTarget != null ? (
              <DestructiveActionDialog
                title="Delete deck?"
                targetLabel="Deck"
                targetName={deletionTarget.deck.name}
                confirmLabel="Delete deck"
                pending={mutations.isPending(deletionTarget.deck.id)}
                {...(mutations.error != null
                  ? { errorMessage: "Unable to delete this deck. Check your connection and try again." }
                  : {})}
                description={
                  <>
                    <p>
                      This permanently deletes {deletionTarget.cardCount}{" "}
                      {deletionTarget.cardCount === 1 ? "card" : "cards"} in this deck.
                    </p>
                    <p>Any in-progress study session for this deck will also end.</p>
                    <p>This action cannot be undone.</p>
                  </>
                }
                onCancel={() => setDeletionTarget(undefined)}
                onConfirm={() => mutations.remove(deletionTarget.deck).catch(() => undefined)}
              />
            ) : null
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
            isPending: mutations.isPending,
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
              if (deck != null) {
                setSuccessMessage(undefined);
                setDeletionTarget({ deck, cardCount: remote.cardsByDeckId(id).length });
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
