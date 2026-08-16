import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { useAuthUid } from "@/entities/auth";
import { useCards } from "@/entities/card";
import { deleteDeck, useDecks } from "@/entities/deck";
import { touchStudySession, useStudySessions } from "@/entities/study-session";
import { useSampleDeckBootstrap } from "@/features/deck-import";
import { DeckList } from "@/features/deck-list";
import { AppLayout } from "@/widgets/app-layout";

export const DeckListPage: React.FC = () => {
  const navigate = useNavigate();
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();
  const sessionsByDeckId = useStudySessions();

  useSampleDeckBootstrap();
  useKey("s", () => void navigate("/settings"));
  useKey("i", () => void navigate("/import"));

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
        onDeleteDeck={(deck) => deleteDeck(uid, deck)}
      />
    </AppLayout>
  );
};
