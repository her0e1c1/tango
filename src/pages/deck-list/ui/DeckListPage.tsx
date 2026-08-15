import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { useAuthUid } from "@/entities/auth";
import { generateCardId, useCards } from "@/entities/card";
import { createDeck, deleteDeck, useDecks } from "@/entities/deck";
import { useSampleDeckBootstrap } from "@/features/deck-import";
import { DeckList } from "@/features/deck-list";
import { removeStudySession, touchStudySession, useStudyHydrated, useStudySessions } from "@/features/study";
import { AppLayout } from "@/widgets/app-layout";

export const DeckListPage: React.FC = () => {
  const navigate = useNavigate();
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();
  const sessionsByDeckId = useStudySessions();
  const hydrated = useStudyHydrated();

  useSampleDeckBootstrap({
    cards,
    createDeck,
    decks,
    generateCardId,
  });
  useKey("s", () => void navigate("/settings"));
  useKey("i", () => void navigate("/import"));

  if (!hydrated) {
    return (
      <div role="status" className="py-10 text-center text-sm text-ink-muted">
        Loading study progress…
      </div>
    );
  }

  return (
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
  );
};
