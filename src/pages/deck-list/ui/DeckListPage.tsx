import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { filterCardsByDeckId } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";
import { createCard, generateCardId } from "@/features/card/create";
import { editCard } from "@/features/card/edit";
import { useCards } from "@/features/card/read";
import { createDeck } from "@/features/deck/create";
import { useDeleteDeck } from "@/features/deck/delete";
import { buildDeckListSections } from "@/features/deck/list";
import { downloadDeckCsv } from "@/features/deck/export";
import { useSampleDeckBootstrap } from "@/features/deck/import";
import { useDecks } from "@/features/deck/read";
import {
  discardStudySessionsMissingDecks,
  removeStudySession,
  touchStudySession,
  useStudyHydrated,
  useStudySessions,
} from "@/features/study";
import { combineRemoteReadStates } from "@/shared/lib/remote-read";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Feedback } from "@/shared/ui/feedback";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { AppLayout } from "@/widgets/app-layout";

import { DeckListView } from "./DeckListView";

export const DeckListPage: React.FC = () => {
  const navigate = useNavigate();
  const cardRemote = useCards();
  const deckRemote = useDecks();
  const readState = combineRemoteReadStates(cardRemote, deckRemote);
  const [deletionTarget, setDeletionTarget] = React.useState<{ deck: Deck; cardCount: number }>();
  const [deletionErrorDeckId, setDeletionErrorDeckId] = React.useState<DeckId>();
  const [successMessage, setSuccessMessage] = React.useState<string>();
  const mutations = useDeleteDeck();
  const [openMenuDeckId, setOpenMenuDeckId] = React.useState<DeckId>();
  const sessionsByDeckId = useStudySessions();
  const hydrated = useStudyHydrated();
  const sections = buildDeckListSections(deckRemote.decks, cardRemote.cards, sessionsByDeckId);
  const synchronized =
    cardRemote.status === "ready" &&
    cardRemote.syncStatus === "synced" &&
    deckRemote.status === "ready" &&
    deckRemote.syncStatus === "synced";
  useSampleDeckBootstrap({
    cards: cardRemote.cards,
    createCard,
    createDeck,
    decks: deckRemote.decks,
    editCard,
    generateCardId,
    synchronized,
  });
  useKey("s", () => void navigate("/settings"));
  useKey("i", () => void navigate("/import"));

  React.useEffect(() => {
    if (!hydrated || deckRemote.status !== "ready" || deckRemote.syncStatus !== "synced") {
      return;
    }
    discardStudySessionsMissingDecks(deckRemote.decks.map((deck) => deck.id));
  }, [deckRemote.decks, deckRemote.status, deckRemote.syncStatus, hydrated]);

  return (
    <RemoteReadBoundary
      status={readState.status}
      hasData={readState.status === "ready" && deckRemote.decks.length > 0}
      emptyLabel="No decks yet."
      onRetry={readState.retry}
    >
      {hydrated ? (
        <AppLayout showHeader>
          <Feedback tone="success">{successMessage}</Feedback>
          {deletionTarget != null ? (
            <DestructiveActionDialog
              title="Delete deck?"
              targetLabel="Deck"
              targetName={deletionTarget.deck.name}
              confirmLabel="Delete deck"
              {...(deletionErrorDeckId === deletionTarget.deck.id
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
              onConfirm={async () => {
                const deck = deletionTarget.deck;
                setDeletionErrorDeckId(undefined);
                try {
                  await mutations.remove(deck);
                  removeStudySession(deck.id);
                  setDeletionTarget(undefined);
                  setSuccessMessage(`Deleted deck “${deck.name}”.`);
                } catch {
                  setDeletionErrorDeckId(deck.id);
                }
              }}
            />
          ) : null}
          <DeckListView
            sections={sections}
            deckCard={{
              openMenuDeckId,
              onToggleMenu: (id) => setOpenMenuDeckId((value) => (value === id ? undefined : id)),
              onCloseMenu: () => setOpenMenuDeckId(undefined),
              onClickEdit: (id) => void navigate(`/deck/${id}/edit`),
              onClickName: (id) => void navigate(`/deck/${id}`),
              onClickContinue: (id) => {
                touchStudySession(id);
                void navigate(`/deck/${id}/study`);
              },
              onClickRestart: (id) => void navigate(`/deck/${id}/start`),
              onClickStudy: (id) => void navigate(`/deck/${id}/start`),
              onClickDownload: (id) => {
                const deck = deckRemote.decksById[id];
                if (deck != null) downloadDeckCsv(deck, filterCardsByDeckId(cardRemote.cards, id));
              },
              onClickDelete: (id) => {
                const deck = deckRemote.decksById[id];
                if (deck != null) {
                  setSuccessMessage(undefined);
                  setDeletionErrorDeckId(undefined);
                  setDeletionTarget({ deck, cardCount: filterCardsByDeckId(cardRemote.cards, id).length });
                }
              },
            }}
          />
        </AppLayout>
      ) : (
        <div role="status" className="py-10 text-center text-sm text-ink-muted">
          Loading study progress…
        </div>
      )}
    </RemoteReadBoundary>
  );
};
