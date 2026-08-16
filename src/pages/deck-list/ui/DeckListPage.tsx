import type * as React from "react";
import { useKey } from "react-use";

import { useAuthUid } from "@/entities/auth";
import { useCards } from "@/entities/card";
import { deleteDeck, useDecks } from "@/entities/deck";
import { touchStudySession, useStudySessions } from "@/entities/study-session";
import { useAddSampleDeck } from "@/features/deck-import";
import { DeckList } from "@/features/deck-list";
import { useNavigation } from "@/shared/routes";
import { AppLayout } from "@/widgets/app-layout";

export const DeckListPage: React.FC = () => {
  const navigation = useNavigation();
  const uid = useAuthUid();
  const cards = useCards();
  const decks = useDecks();
  const sessionsByDeckId = useStudySessions();

  useAddSampleDeck();
  useKey("s", () => void navigation.goToSettings());
  useKey("i", () => void navigation.goToDeckImport());

  return (
    <AppLayout showHeader>
      <DeckList
        decks={decks}
        cards={cards}
        sessionsByDeckId={sessionsByDeckId}
        onViewDeck={(id) => void navigation.goToCardList(id)}
        onContinueDeck={(id) => {
          touchStudySession(id);
          void navigation.goToDeckStudy(id);
        }}
        onStartDeck={(id) => void navigation.goToDeckStudyStart(id)}
        onEditDeck={(id) => void navigation.goToDeckForm(id)}
        onDeleteDeck={(deck) => deleteDeck(uid, deck)}
      />
    </AppLayout>
  );
};
