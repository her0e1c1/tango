import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { useAuthSession } from "@/entities/auth";
import { createCard, editCard, generateCardId, useCards } from "@/entities/card";
import { createDeck, deleteDeck, useDecks } from "@/entities/deck";
import { useCardReadState } from "@/features/card/read";
import { useSampleDeckBootstrap } from "@/features/deck-import";
import { DeckList } from "@/features/deck-list";
import { removeStudySession, touchStudySession, useStudyHydrated, useStudySessions } from "@/features/study";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { AppLayout } from "@/widgets/app-layout";

export const DeckListPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuthSession();
  const cards = useCards();
  const cardReadState = useCardReadState();
  const decks = useDecks();
  const sessionsByDeckId = useStudySessions();
  const hydrated = useStudyHydrated();
  const synchronized = cardReadState.serverConfirmed;
  const uid = auth.status === "authenticated" ? auth.uid : "";

  useSampleDeckBootstrap({
    cards,
    createCard,
    createDeck,
    decks,
    editCard,
    generateCardId,
    synchronized,
  });
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
            onDeleteDeck={async (deck) => {
              await deleteDeck(uid, deck);
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
