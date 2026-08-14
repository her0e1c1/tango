import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { filterCardsByDeckId, useCards } from "@/entities/card";
import type { CardCreateInput, CardEdit } from "@/entities/card";
import { type Deck, type DeckId, useDecks } from "@/entities/deck";
import type { DeckCreateInput } from "@/entities/deck";
import { useCardReadState } from "@/features/card/read";
import { useDeleteDeck } from "@/features/deck/delete";
import { buildDeckListSections } from "@/features/deck/list";
import { downloadDeckCsv } from "@/features/deck/export";
import { useSampleDeckBootstrap } from "@/features/deck/import";
import { removeStudySession, touchStudySession, useStudyHydrated, useStudySessions } from "@/features/study";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Feedback } from "@/shared/ui/feedback";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { AppLayout } from "@/widgets/app-layout";

import { DeckListView } from "./DeckListView";

interface DeckListPageProps {
  createCard?: (uid: string, card: CardCreateInput) => Promise<void>;
  createDeck?: (uid: string, deck: DeckCreateInput) => Promise<void>;
  deleteDeck?: (uid: string, deck: Deck) => Promise<void>;
  editCard?: (uid: string, card: CardEdit) => Promise<void>;
  generateCardId?: () => string;
  generateDeckId?: () => string;
}

const unavailableMutation = async (): Promise<never> => {
  throw new Error("Remote mutations are unavailable");
};
const unavailableId = (): never => {
  throw new Error("Remote id generation is unavailable");
};

const useSampleDeck = (
  { createCard, createDeck, editCard, generateCardId, generateDeckId }: DeckListPageProps,
  cards: ReturnType<typeof useCards>,
  decks: ReturnType<typeof useDecks>,
  synchronized: boolean
) =>
  useSampleDeckBootstrap({
    cards,
    createCard: createCard ?? unavailableMutation,
    createDeck: createDeck ?? unavailableMutation,
    decks,
    editCard: editCard ?? unavailableMutation,
    generateCardId: generateCardId ?? unavailableId,
    generateDeckId: generateDeckId ?? unavailableId,
    synchronized,
  });

export const DeckListPage: React.FC<DeckListPageProps> = (props) => {
  const navigate = useNavigate();
  const cards = useCards();
  const cardReadState = useCardReadState();
  const decks = useDecks();
  const [deletionTarget, setDeletionTarget] = React.useState<{ deck: Deck; cardCount: number }>();
  const [deletionErrorDeckId, setDeletionErrorDeckId] = React.useState<DeckId>();
  const [successMessage, setSuccessMessage] = React.useState<string>();
  const mutations = useDeleteDeck(props.deleteDeck);
  const [openMenuDeckId, setOpenMenuDeckId] = React.useState<DeckId>();
  const sessionsByDeckId = useStudySessions();
  const hydrated = useStudyHydrated();
  const sections = buildDeckListSections(decks, cards, sessionsByDeckId);
  const synchronized = cardReadState.status === "ready" && cardReadState.syncStatus === "synced";
  useSampleDeck(props, cards, decks, synchronized);
  useKey("s", () => void navigate("/settings"));
  useKey("i", () => void navigate("/import"));

  return (
    <RemoteReadBoundary
      status={cardReadState.status}
      hasData={cardReadState.status === "ready" && decks.length > 0}
      emptyLabel="No decks yet."
      onRetry={cardReadState.retry}
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
                const deck = decks.find((candidate) => candidate.id === id);
                if (deck != null) downloadDeckCsv(deck, filterCardsByDeckId(cards, id));
              },
              onClickDelete: (id) => {
                const deck = decks.find((candidate) => candidate.id === id);
                if (deck != null) {
                  setSuccessMessage(undefined);
                  setDeletionErrorDeckId(undefined);
                  setDeletionTarget({ deck, cardCount: filterCardsByDeckId(cards, id).length });
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
