import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { useCards } from "@/entities/card";
import type { CardCreateInput, CardEdit } from "@/entities/card";
import { type Deck, useDecks } from "@/entities/deck";
import type { DeckCreateInput } from "@/entities/deck";
import { useCardReadState } from "@/features/card/read";
import { useDeleteDeck } from "@/features/deck/delete";
import { downloadDeckCsv } from "@/features/deck/export";
import { useSampleDeckBootstrap } from "@/features/deck-import";
import { DeckList } from "@/features/deck-list";
import { removeStudySession, touchStudySession, useStudyHydrated, useStudySessions } from "@/features/study";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { AppLayout } from "@/widgets/app-layout";

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
  const deleteDeck = useDeleteDeck(props.deleteDeck);
  const sessionsByDeckId = useStudySessions();
  const hydrated = useStudyHydrated();
  const synchronized = cardReadState.serverConfirmed;

  useSampleDeck(props, cards, decks, synchronized);
  useKey("s", () => void navigate("/settings"));
  useKey("i", () => void navigate("/import"));

  return (
    <RemoteReadBoundary
      status={cardReadState.status}
      hasData={cardReadState.status === "ready" && decks.length > 0}
      emptyLabel="No decks yet."
    >
      {hydrated ? (
        <AppLayout showHeader>
          <DeckList
            decks={decks}
            cards={cards}
            sessionsByDeckId={sessionsByDeckId}
            onViewDeck={(id) => void navigate(`/deck/${id}`)}
            onContinueDeck={(id) => {
              touchStudySession(id);
              void navigate(`/deck/${id}/study`);
            }}
            onStartDeck={(id) => void navigate(`/deck/${id}/start`)}
            onEditDeck={(id) => void navigate(`/deck/${id}/edit`)}
            onDownloadDeck={downloadDeckCsv}
            onDeleteDeck={async (deck) => {
              await deleteDeck.remove(deck);
              removeStudySession(deck.id);
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
