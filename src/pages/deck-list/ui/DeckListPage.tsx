import * as React from "react";
import { useKey } from "react-use";

import type { Deck, DeckId } from "@/entities/deck";
import { useCardMutations } from "@/features/card";
import { useDeckMutations } from "@/features/deck";
import { downloadDeckData, useDeckImport, useSampleDeckBootstrap } from "@/features/import";
import {
  discardStudySessionsMissingDecks,
  removeStudySession,
  touchStudySession,
  useStudyHydrated,
  useStudySessions,
} from "@/features/study";
import { useActions } from "@/features/app-controls";
import { useConfig } from "@/entities/config";
import { useRemoteCollections } from "@/features/remote-collections";
import { useAuth } from "@/shared/auth";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Feedback } from "@/shared/ui/feedback";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";

import { buildDeckListSections } from "../model/buildDeckListSections";
import { DeckListView } from "./DeckListView";

export const DeckListPage: React.FC = () => {
  const actions = useActions();
  const config = useConfig();
  const auth = useAuth();
  const remote = useRemoteCollections();
  const [deletionTarget, setDeletionTarget] = React.useState<{ deck: Deck; cardCount: number }>();
  const [successMessage, setSuccessMessage] = React.useState<string>();
  const mutations = useDeckMutations({
    onRemoveSuccess: (deck) => {
      removeStudySession(deck.id);
      setDeletionTarget((target) => (target?.deck.id === deck.id ? undefined : target));
      setSuccessMessage(`Deleted deck “${deck.name}”.`);
    },
  });
  const cardMutations = useCardMutations({ cardById: remote.cardById });
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const deckImport = useDeckImport({
    uid,
    status: remote.status,
    syncStatus: remote.syncStatus,
    decks: remote.decks,
    cardsByDeckId: remote.cardsByDeckId,
    createDeck: mutations.create,
    bulkUpsert: cardMutations.bulkUpsert,
  });
  const [openMenuDeckId, setOpenMenuDeckId] = React.useState<DeckId>();
  const sessionsByDeckId = useStudySessions();
  const hydrated = useStudyHydrated();
  const sections = buildDeckListSections(remote.decks, remote.cards, sessionsByDeckId);
  useSampleDeckBootstrap({
    uid,
    status: remote.status,
    syncStatus: remote.syncStatus,
    deckCount: remote.decks.length,
    addSample: deckImport.addSample,
  });
  useKey("s", actions.goToSettings);
  useKey("i", actions.goToImport);

  React.useEffect(() => {
    if (!hydrated || mutations.pending || remote.status !== "ready" || remote.syncStatus !== "synced") return;
    discardStudySessionsMissingDecks(remote.decks.map((deck) => deck.id));
  }, [hydrated, mutations.pending, remote.decks, remote.status, remote.syncStatus]);

  return (
    <RemoteReadBoundary
      status={remote.status}
      hasData={remote.decks.length > 0}
      emptyLabel="No decks yet."
      onRetry={remote.retry}
    >
      {hydrated ? (
        <DeckListView
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
              onClickImport: actions.goToImport,
              onClickSettings: actions.goToSettings,
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
              touchStudySession(id);
              actions.goToStudy(id);
            },
            onClickRestart: actions.goToStart,
            onClickStudy: actions.goToStart,
            onClickDownload: (id) => {
              const deck = remote.deckById(id);
              if (deck != null) downloadDeckData(deck, remote.cardsByDeckId(id));
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
