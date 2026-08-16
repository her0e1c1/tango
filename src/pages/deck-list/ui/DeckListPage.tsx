import type * as React from "react";
import { useKey } from "react-use";

import { useAuthUid } from "@/entities/auth";
import { useCards } from "@/entities/card";
import { deleteDeck, useDecks } from "@/entities/deck";
import { touchStudySession, useStudySessions } from "@/entities/study-session";
import { useAddSampleDeck } from "@/features/deck-import";
import { DeckList } from "@/features/deck-list";
import { routes, useNavigation } from "@/shared/routes";
import { AppLayout } from "@/widgets/app-layout";

export const DeckListPage: React.FC = () => {
  const navigation = useNavigation();
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();
  const sessionsByDeckId = useStudySessions();

  useAddSampleDeck();
  useKey("s", () => void navigation.to(routes.settings.to()));
  useKey("i", () => void navigation.to(routes.deckImport.to()));

  return (
    <AppLayout showHeader>
      <DeckList
        decks={decks}
        cards={cards}
        sessionsByDeckId={sessionsByDeckId}
        onViewDeck={(id) => void navigation.to(routes.cardList.to(id))}
        onContinueDeck={(id) => {
          touchStudySession(id);
          void navigation.to(routes.deckStudy.to(id));
        }}
        onStartDeck={(id) => void navigation.to(routes.deckStudyStart.to(id))}
        onEditDeck={(id) => void navigation.to(routes.deckForm.to(id))}
        onDeleteDeck={(deck) => deleteDeck(uid, deck)}
      />
    </AppLayout>
  );
};
